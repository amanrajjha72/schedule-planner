import { Button, Card, MessageBar, MessageBarBody, MessageBarTitle, Skeleton, SkeletonItem, Title3, Body1 } from '@fluentui/react-components';
import { ArrowClockwiseRegular, CalendarEmptyRegular, ClipboardTaskRegular } from '@fluentui/react-icons';

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="state-card" aria-label="Loading planner data" aria-busy="true">
      <Skeleton aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => <SkeletonItem key={index} className="skeleton-row" />)}
      </Skeleton>
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <MessageBar intent="error" className="error-banner">
      <MessageBarBody>
        <MessageBarTitle>Couldn't refresh your plan</MessageBarTitle>
        {message}
      </MessageBarBody>
      <Button appearance="secondary" icon={<ArrowClockwiseRegular />} onClick={onRetry}>Retry</Button>
    </MessageBar>
  );
}

export function EmptyState({ title, description, action, onAction }: { title: string; description: string; action: string; onAction(): void }) {
  return (
    <Card className="empty-state" appearance="outline">
      <CalendarEmptyRegular className="empty-state__icon" aria-hidden="true" />
      <Title3>{title}</Title3>
      <Body1 className="muted-copy">{description}</Body1>
      <Button appearance="primary" icon={<ClipboardTaskRegular />} onClick={onAction}>{action}</Button>
    </Card>
  );
}