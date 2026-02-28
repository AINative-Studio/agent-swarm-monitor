import NetworkClient from './NetworkClient';

export const metadata = {
    title: 'Network Management | OpenClaw',
    description: 'P2P network topology, peer management, and IP pool monitoring',
};

export default function NetworkPage() {
    return <NetworkClient />;
}
