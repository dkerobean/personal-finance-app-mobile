import React from 'react';
import { View, Text } from 'react-native';
import { 
  Badge,
  BadgeText,
  BadgeIcon,
  HStack,
  VStack,
  Icon
} from '@gluestack-ui/themed';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  WifiOff,
  RefreshCw 
} from 'lucide-react-native';

interface SyncStatusIndicatorProps {
  syncStatus?: 'active' | 'auth_required' | 'error' | 'in_progress';
  lastSyncAt?: string | null;
  isOnline?: boolean;
  size?: 'small' | 'medium' | 'large';
  platformSource?: 'mono' | 'mtn_momo';
  showPlatformBadge?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncStatus = 'active',
  lastSyncAt,
  isOnline = true,
  size = 'medium',
  platformSource,
  showPlatformBadge = false
}) => {
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        variant: 'outline',
        action: 'muted',
        icon: WifiOff,
        text: 'Offline',
        color: '$gray600'
      };
    }

    switch (syncStatus) {
      case 'active':
        return {
          variant: 'solid',
          action: 'success',
          icon: CheckCircle,
          text: 'Synced',
          color: '$success600'
        };
      case 'auth_required':
        return {
          variant: 'solid',
          action: 'warning',
          icon: AlertCircle,
          text: 'Auth Required',
          color: '$warning600'
        };
      case 'error':
        return {
          variant: 'solid',
          action: 'error',
          icon: AlertCircle,
          text: 'Sync Error',
          color: '$error600'
        };
      case 'in_progress':
        return {
          variant: 'solid',
          action: 'info',
          icon: RefreshCw,
          text: 'Syncing...',
          color: '$info600'
        };
      default:
        return {
          variant: 'outline',
          action: 'muted',
          icon: Clock,
          text: 'Unknown',
          color: '$gray600'
        };
    }
  };

  const formatLastSyncTime = (lastSync: string | null): string => {
    if (!lastSync) return 'Never synced';

    const now = new Date();
    const syncDate = new Date(lastSync);
    const diffInMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return syncDate.toLocaleDateString();
  };

  const statusConfig = getStatusConfig();
  const IconComponent = statusConfig.icon;

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return {
          badgeSize: 'sm' as const,
          iconSize: 12,
          textSize: 'xs' as const
        };
      case 'large':
        return {
          badgeSize: 'lg' as const,
          iconSize: 18,
          textSize: 'md' as const
        };
      default:
        return {
          badgeSize: 'md' as const,
          iconSize: 14,
          textSize: 'sm' as const
        };
    }
  };

  const sizeProps = getSizeProps();

  const getPlatformBadge = () => {
    if (!showPlatformBadge || !platformSource) return null;

    const platformConfig = {
      mono: { text: 'Bank', color: '$blue600' },
      mtn_momo: { text: 'MoMo', color: '$yellow600' }
    };

    const config = platformConfig[platformSource];
    
    return (
      <Badge size="sm" variant="outline" action="muted">
        <BadgeText size="xs" color={config.color}>
          {config.text}
        </BadgeText>
      </Badge>
    );
  };

  if (size === 'small') {
    return (
      <HStack space="xs" alignItems="center">
        <Badge
          size={sizeProps.badgeSize}
          variant={statusConfig.variant}
          action={statusConfig.action}
        >
          <BadgeIcon as={IconComponent} size={sizeProps.iconSize} />
          <BadgeText size={sizeProps.textSize}>
            {statusConfig.text}
          </BadgeText>
        </Badge>
        {getPlatformBadge()}
      </HStack>
    );
  }

  return (
    <VStack space="xs">
      <HStack space="xs" alignItems="center">
        <Badge
          size={sizeProps.badgeSize}
          variant={statusConfig.variant}
          action={statusConfig.action}
        >
          <BadgeIcon as={IconComponent} size={sizeProps.iconSize} />
          <BadgeText size={sizeProps.textSize}>
            {statusConfig.text}
          </BadgeText>
        </Badge>
        {getPlatformBadge()}
      </HStack>
      
      {size !== 'small' && lastSyncAt && (
        <Text size="xs" color="$textLight600">
          {formatLastSyncTime(lastSyncAt)}
        </Text>
      )}
    </VStack>
  );
};

export default SyncStatusIndicator;