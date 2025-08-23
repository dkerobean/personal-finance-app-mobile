-- Create indexes for efficient report queries
CREATE INDEX IF NOT EXISTS idx_transactions_date_user_type ON public.transactions(transaction_date, user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_category ON public.transactions(user_id, transaction_date, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_month_user ON public.transactions(date_trunc('month', transaction_date::date), user_id);

-- Function to get monthly report summary for a specific month
CREATE OR REPLACE FUNCTION public.get_monthly_report_summary(
  p_user_id UUID,
  p_month TEXT -- Format: 'YYYY-MM'
)
RETURNS TABLE (
  month TEXT,
  total_income DECIMAL,
  total_expenses DECIMAL,
  net_income DECIMAL,
  transaction_count BIGINT,
  income_transaction_count BIGINT,
  expense_transaction_count BIGINT,
  avg_transaction_amount DECIMAL
) AS $$
DECLARE
  month_start DATE;
  month_end DATE;
BEGIN
  -- Parse month and calculate boundaries
  month_start := (p_month || '-01')::DATE;
  month_end := (month_start + INTERVAL '1 month - 1 day')::DATE;
  
  RETURN QUERY
  SELECT 
    p_month as month,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as net_income,
    COUNT(*) as transaction_count,
    COUNT(CASE WHEN t.type = 'income' THEN 1 END) as income_transaction_count,
    COUNT(CASE WHEN t.type = 'expense' THEN 1 END) as expense_transaction_count,
    COALESCE(AVG(t.amount), 0) as avg_transaction_amount
  FROM public.transactions t
  WHERE t.user_id = p_user_id
    AND t.transaction_date::date >= month_start
    AND t.transaction_date::date <= month_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category breakdown for a specific month
CREATE OR REPLACE FUNCTION public.get_monthly_category_breakdown(
  p_user_id UUID,
  p_month TEXT -- Format: 'YYYY-MM'
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_icon TEXT,
  total_amount DECIMAL,
  transaction_count BIGINT,
  avg_transaction_amount DECIMAL,
  transaction_type TEXT,
  percentage DECIMAL
) AS $$
DECLARE
  month_start DATE;
  month_end DATE;
  total_expenses DECIMAL;
  total_income DECIMAL;
BEGIN
  -- Parse month and calculate boundaries
  month_start := (p_month || '-01')::DATE;
  month_end := (month_start + INTERVAL '1 month - 1 day')::DATE;
  
  -- Get total expenses and income for percentage calculations
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
  INTO total_expenses, total_income
  FROM public.transactions t
  WHERE t.user_id = p_user_id
    AND t.transaction_date::date >= month_start
    AND t.transaction_date::date <= month_end;
  
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    c.icon_name as category_icon,
    SUM(t.amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(t.amount) as avg_transaction_amount,
    t.type as transaction_type,
    CASE 
      WHEN t.type = 'expense' AND total_expenses > 0 THEN (SUM(t.amount) / total_expenses) * 100
      WHEN t.type = 'income' AND total_income > 0 THEN (SUM(t.amount) / total_income) * 100
      ELSE 0
    END as percentage
  FROM public.transactions t
  JOIN public.categories c ON t.category_id = c.id
  WHERE t.user_id = p_user_id
    AND t.transaction_date::date >= month_start
    AND t.transaction_date::date <= month_end
  GROUP BY c.id, c.name, c.icon_name, t.type, total_expenses, total_income
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get largest transactions for a specific month
CREATE OR REPLACE FUNCTION public.get_monthly_largest_transactions(
  p_user_id UUID,
  p_month TEXT -- Format: 'YYYY-MM'
)
RETURNS TABLE (
  largest_expense_amount DECIMAL,
  largest_expense_description TEXT,
  largest_expense_category TEXT,
  largest_expense_date TEXT,
  largest_income_amount DECIMAL,
  largest_income_description TEXT,
  largest_income_category TEXT,
  largest_income_date TEXT
) AS $$
DECLARE
  month_start DATE;
  month_end DATE;
BEGIN
  -- Parse month and calculate boundaries
  month_start := (p_month || '-01')::DATE;
  month_end := (month_start + INTERVAL '1 month - 1 day')::DATE;
  
  RETURN QUERY
  SELECT 
    expense_data.amount as largest_expense_amount,
    expense_data.description as largest_expense_description,
    expense_data.category_name as largest_expense_category,
    expense_data.transaction_date as largest_expense_date,
    income_data.amount as largest_income_amount,
    income_data.description as largest_income_description,
    income_data.category_name as largest_income_category,
    income_data.transaction_date as largest_income_date
  FROM (
    -- Largest expense
    SELECT 
      t.amount,
      t.description,
      c.name as category_name,
      t.transaction_date::text
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = p_user_id
      AND t.type = 'expense'
      AND t.transaction_date::date >= month_start
      AND t.transaction_date::date <= month_end
    ORDER BY t.amount DESC
    LIMIT 1
  ) expense_data
  FULL OUTER JOIN (
    -- Largest income
    SELECT 
      t.amount,
      t.description,
      c.name as category_name,
      t.transaction_date::text
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = p_user_id
      AND t.type = 'income'
      AND t.transaction_date::date >= month_start
      AND t.transaction_date::date <= month_end
    ORDER BY t.amount DESC
    LIMIT 1
  ) income_data ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get complete monthly report data
CREATE OR REPLACE FUNCTION public.get_complete_monthly_report(
  p_user_id UUID,
  p_month TEXT -- Format: 'YYYY-MM'
)
RETURNS JSON AS $$
DECLARE
  report_summary RECORD;
  category_breakdown JSON;
  largest_transactions RECORD;
  result JSON;
BEGIN
  -- Get report summary
  SELECT * INTO report_summary
  FROM public.get_monthly_report_summary(p_user_id, p_month);
  
  -- Get category breakdown as JSON array
  SELECT json_agg(
    json_build_object(
      'categoryId', category_id,
      'categoryName', category_name,
      'categoryIcon', category_icon,
      'totalAmount', total_amount,
      'transactionCount', transaction_count,
      'avgTransactionAmount', avg_transaction_amount,
      'type', transaction_type,
      'percentage', percentage
    )
  ) INTO category_breakdown
  FROM public.get_monthly_category_breakdown(p_user_id, p_month);
  
  -- Get largest transactions
  SELECT * INTO largest_transactions
  FROM public.get_monthly_largest_transactions(p_user_id, p_month);
  
  -- Build complete report JSON
  result := json_build_object(
    'month', report_summary.month,
    'totalIncome', COALESCE(report_summary.total_income, 0),
    'totalExpenses', COALESCE(report_summary.total_expenses, 0),
    'netIncome', COALESCE(report_summary.net_income, 0),
    'transactionCount', COALESCE(report_summary.transaction_count, 0),
    'incomeTransactionCount', COALESCE(report_summary.income_transaction_count, 0),
    'expenseTransactionCount', COALESCE(report_summary.expense_transaction_count, 0),
    'avgTransactionAmount', COALESCE(report_summary.avg_transaction_amount, 0),
    'categoryBreakdown', COALESCE(category_breakdown, '[]'::json),
    'topCategories', COALESCE(
      (
        SELECT json_agg(category_data)
        FROM (
          SELECT json_build_object(
            'categoryId', category_id,
            'categoryName', category_name,
            'categoryIcon', category_icon,
            'totalAmount', total_amount,
            'transactionCount', transaction_count,
            'avgTransactionAmount', avg_transaction_amount,
            'type', transaction_type,
            'percentage', percentage
          ) as category_data
          FROM public.get_monthly_category_breakdown(p_user_id, p_month)
          WHERE transaction_type = 'expense'
          ORDER BY total_amount DESC
          LIMIT 5
        ) top_expenses
      ), 
      '[]'::json
    ),
    'largestExpense', CASE 
      WHEN largest_transactions.largest_expense_amount IS NOT NULL THEN
        json_build_object(
          'amount', largest_transactions.largest_expense_amount,
          'description', largest_transactions.largest_expense_description,
          'category_name', largest_transactions.largest_expense_category,
          'date', largest_transactions.largest_expense_date
        )
      ELSE NULL
    END,
    'largestIncome', CASE 
      WHEN largest_transactions.largest_income_amount IS NOT NULL THEN
        json_build_object(
          'amount', largest_transactions.largest_income_amount,
          'description', largest_transactions.largest_income_description,
          'category_name', largest_transactions.largest_income_category,
          'date', largest_transactions.largest_income_date
        )
      ELSE NULL
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available months with transaction data for a user
CREATE OR REPLACE FUNCTION public.get_user_available_months(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  month TEXT,
  transaction_count BIGINT,
  total_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(date_trunc('month', t.transaction_date::date), 'YYYY-MM') as month,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount
  FROM public.transactions t
  WHERE t.user_id = p_user_id
  GROUP BY date_trunc('month', t.transaction_date::date)
  ORDER BY date_trunc('month', t.transaction_date::date) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get report comparison between two months
CREATE OR REPLACE FUNCTION public.get_report_comparison(
  p_user_id UUID,
  p_current_month TEXT,
  p_previous_month TEXT
)
RETURNS JSON AS $$
DECLARE
  current_summary RECORD;
  previous_summary RECORD;
  change_income DECIMAL;
  change_expenses DECIMAL;
  change_net DECIMAL;
  result JSON;
BEGIN
  -- Get current month summary
  SELECT * INTO current_summary
  FROM public.get_monthly_report_summary(p_user_id, p_current_month);
  
  -- Get previous month summary
  SELECT * INTO previous_summary
  FROM public.get_monthly_report_summary(p_user_id, p_previous_month);
  
  -- Calculate percentage changes
  change_income := CASE 
    WHEN previous_summary.total_income > 0 THEN
      ((current_summary.total_income - previous_summary.total_income) / previous_summary.total_income) * 100
    ELSE 0
  END;
  
  change_expenses := CASE 
    WHEN previous_summary.total_expenses > 0 THEN
      ((current_summary.total_expenses - previous_summary.total_expenses) / previous_summary.total_expenses) * 100
    ELSE 0
  END;
  
  change_net := CASE 
    WHEN previous_summary.net_income != 0 THEN
      ((current_summary.net_income - previous_summary.net_income) / ABS(previous_summary.net_income)) * 100
    ELSE 0
  END;
  
  -- Build comparison JSON
  result := json_build_object(
    'currentMonth', json_build_object(
      'month', current_summary.month,
      'totalIncome', COALESCE(current_summary.total_income, 0),
      'totalExpenses', COALESCE(current_summary.total_expenses, 0),
      'netIncome', COALESCE(current_summary.net_income, 0),
      'transactionCount', COALESCE(current_summary.transaction_count, 0)
    ),
    'previousMonth', json_build_object(
      'month', previous_summary.month,
      'totalIncome', COALESCE(previous_summary.total_income, 0),
      'totalExpenses', COALESCE(previous_summary.total_expenses, 0),
      'netIncome', COALESCE(previous_summary.net_income, 0),
      'transactionCount', COALESCE(previous_summary.transaction_count, 0)
    ),
    'changeIncome', COALESCE(change_income, 0),
    'changeExpenses', COALESCE(change_expenses, 0),
    'changeNet', COALESCE(change_net, 0)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;