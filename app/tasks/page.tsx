import TasksClient from './TasksClient';

export const metadata = {
    title: 'Task Queue - AgentClaw',
    description: 'Task queue monitoring and performance dashboard',
};

export default function TasksPage() {
    return <TasksClient />;
}
