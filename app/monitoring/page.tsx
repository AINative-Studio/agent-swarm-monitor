import MonitoringClient from './MonitoringClient';

export const metadata = {
    title: 'Monitoring - AgentClaw',
    description: 'Swarm health monitoring and timeline dashboard',
};

export default function MonitoringPage() {
    return <MonitoringClient />;
}
