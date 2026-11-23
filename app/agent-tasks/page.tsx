import AgentTasksClient from './AgentTasksClient';

export const metadata = {
    title: 'Agent Tasks - AgentClaw',
    description: 'Create and manage tasks for non-technical agents',
};

export default function AgentTasksPage() {
    return <AgentTasksClient />;
}
