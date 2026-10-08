export default function LoadingSpinner({ size = 32 }) {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div style={{ width: size, height: size, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}
