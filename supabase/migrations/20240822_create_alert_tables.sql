-- Create alert_settings table for user notification preferences
CREATE TABLE IF NOT EXISTS public.alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  warning_threshold INTEGER NOT NULL DEFAULT 90 CHECK (warning_threshold > 0 AND warning_threshold <= 100),
  over_budget_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Create alert_history table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'over_budget')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_id TEXT, -- OneSignal notification ID
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  spent_amount DECIMAL(15,2) NOT NULL,
  budget_amount DECIMAL(15,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  
  -- Index for efficient queries
  UNIQUE(budget_id, alert_type, sent_at::date) -- Prevent duplicate alerts per day
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_settings_user_id ON public.alert_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON public.alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_budget_id ON public.alert_history(budget_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_sent_at ON public.alert_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_status ON public.alert_history(status);

-- Enable Row Level Security
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_settings
CREATE POLICY "Users can view their own alert settings"
  ON public.alert_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert settings"
  ON public.alert_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert settings"
  ON public.alert_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert settings"
  ON public.alert_settings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for alert_history
CREATE POLICY "Users can view their own alert history"
  ON public.alert_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert alert history"
  ON public.alert_history FOR INSERT
  WITH CHECK (true); -- Allow service role to insert notifications

CREATE POLICY "Service role can update alert history"
  ON public.alert_history FOR UPDATE
  USING (true); -- Allow service role to update notification status

-- Create function to automatically create default alert settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_alert_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.alert_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create alert settings for new users
DROP TRIGGER IF EXISTS create_alert_settings_for_new_user ON auth.users;
CREATE TRIGGER create_alert_settings_for_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_alert_settings();

-- Helper function to get user's alert settings with defaults
CREATE OR REPLACE FUNCTION public.get_user_alert_settings(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  budget_alerts_enabled BOOLEAN,
  warning_threshold INTEGER,
  over_budget_alerts_enabled BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.budget_alerts_enabled,
    s.warning_threshold,
    s.over_budget_alerts_enabled,
    s.created_at,
    s.updated_at
  FROM public.alert_settings s
  WHERE s.user_id = user_uuid;
  
  -- If no settings exist, create and return defaults
  IF NOT FOUND THEN
    INSERT INTO public.alert_settings (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING 
      alert_settings.id,
      alert_settings.user_id,
      alert_settings.budget_alerts_enabled,
      alert_settings.warning_threshold,
      alert_settings.over_budget_alerts_enabled,
      alert_settings.created_at,
      alert_settings.updated_at
    INTO 
      id,
      user_id,
      budget_alerts_enabled,
      warning_threshold,
      over_budget_alerts_enabled,
      created_at,
      updated_at;
    
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if alert should be sent (prevent duplicates)
CREATE OR REPLACE FUNCTION public.should_send_alert(
  p_budget_id UUID,
  p_alert_type TEXT,
  p_current_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  last_alert_date DATE;
BEGIN
  -- Get the last alert sent for this budget and type
  SELECT sent_at::date INTO last_alert_date
  FROM public.alert_history
  WHERE budget_id = p_budget_id 
    AND alert_type = p_alert_type
    AND status = 'sent'
  ORDER BY sent_at DESC
  LIMIT 1;
  
  -- If no alert was sent or it was sent on a different day, allow new alert
  RETURN (last_alert_date IS NULL OR last_alert_date < p_current_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to record alert history
CREATE OR REPLACE FUNCTION public.record_alert_history(
  p_user_id UUID,
  p_budget_id UUID,
  p_alert_type TEXT,
  p_notification_id TEXT,
  p_status TEXT,
  p_spent_amount DECIMAL,
  p_budget_amount DECIMAL,
  p_percentage DECIMAL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO public.alert_history (
    user_id,
    budget_id,
    alert_type,
    notification_id,
    status,
    spent_amount,
    budget_amount,
    percentage,
    error_message
  )
  VALUES (
    p_user_id,
    p_budget_id,
    p_alert_type,
    p_notification_id,
    p_status,
    p_spent_amount,
    p_budget_amount,
    p_percentage,
    p_error_message
  )
  RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent alert history for a user
CREATE OR REPLACE FUNCTION public.get_user_alert_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  budget_id UUID,
  alert_type TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  spent_amount DECIMAL,
  budget_amount DECIMAL,
  percentage DECIMAL,
  category_name TEXT,
  budget_month TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ah.id,
    ah.budget_id,
    ah.alert_type,
    ah.sent_at,
    ah.status,
    ah.spent_amount,
    ah.budget_amount,
    ah.percentage,
    c.name as category_name,
    b.month as budget_month
  FROM public.alert_history ah
  JOIN public.budgets b ON ah.budget_id = b.id
  JOIN public.categories c ON b.category_id = c.id
  WHERE ah.user_id = p_user_id
  ORDER BY ah.sent_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger for alert_settings
CREATE OR REPLACE FUNCTION public.update_alert_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_alert_settings_updated_at ON public.alert_settings;
CREATE TRIGGER update_alert_settings_updated_at
  BEFORE UPDATE ON public.alert_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_alert_settings_updated_at();

-- Function to get budget with spending data for alert processing
CREATE OR REPLACE FUNCTION public.get_budget_with_spending(p_budget_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  amount DECIMAL,
  month TEXT,
  category_name TEXT,
  spent DECIMAL,
  percentage DECIMAL,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.category_id,
    b.amount,
    b.month,
    c.name as category_name,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
    CASE 
      WHEN b.amount > 0 THEN 
        (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) / b.amount) * 100
      ELSE 0 
    END as percentage,
    COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as transaction_count
  FROM public.budgets b
  JOIN public.categories c ON b.category_id = c.id
  LEFT JOIN public.transactions t ON (
    t.category_id = b.category_id 
    AND t.user_id = b.user_id
    AND date_trunc('month', t.transaction_date::date) = b.month::date
    AND t.type = 'expense'
  )
  WHERE b.id = p_budget_id
  GROUP BY b.id, b.user_id, b.category_id, b.amount, b.month, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get budgets with spending for a specific user
CREATE OR REPLACE FUNCTION public.get_budgets_with_spending_for_user(
  p_user_id UUID,
  p_month TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  amount DECIMAL,
  month TEXT,
  category_name TEXT,
  spent DECIMAL,
  percentage DECIMAL,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.category_id,
    b.amount,
    b.month,
    c.name as category_name,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
    CASE 
      WHEN b.amount > 0 THEN 
        (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) / b.amount) * 100
      ELSE 0 
    END as percentage,
    COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as transaction_count
  FROM public.budgets b
  JOIN public.categories c ON b.category_id = c.id
  LEFT JOIN public.transactions t ON (
    t.category_id = b.category_id 
    AND t.user_id = b.user_id
    AND date_trunc('month', t.transaction_date::date) = b.month::date
    AND t.type = 'expense'
  )
  WHERE b.user_id = p_user_id 
    AND b.month = p_month
  GROUP BY b.id, b.user_id, b.category_id, b.amount, b.month, c.name
  ORDER BY percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all budgets with spending for current month (for bulk processing)
CREATE OR REPLACE FUNCTION public.get_all_budgets_with_spending_current_month()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  amount DECIMAL,
  month TEXT,
  category_name TEXT,
  spent DECIMAL,
  percentage DECIMAL,
  transaction_count BIGINT
) AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := to_char(CURRENT_DATE, 'YYYY-MM') || '-01';
  
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.category_id,
    b.amount,
    b.month,
    c.name as category_name,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
    CASE 
      WHEN b.amount > 0 THEN 
        (COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) / b.amount) * 100
      ELSE 0 
    END as percentage,
    COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as transaction_count
  FROM public.budgets b
  JOIN public.categories c ON b.category_id = c.id
  LEFT JOIN public.transactions t ON (
    t.category_id = b.category_id 
    AND t.user_id = b.user_id
    AND date_trunc('month', t.transaction_date::date) = b.month::date
    AND t.type = 'expense'
  )
  WHERE b.month = current_month
  GROUP BY b.id, b.user_id, b.category_id, b.amount, b.month, c.name
  HAVING COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) > 0 -- Only budgets with spending
  ORDER BY percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;