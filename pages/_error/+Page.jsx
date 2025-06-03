export default function ErrorPage({ is404 }) {
  return (
    <div style={{ padding: '2rem', color: 'red' }}>
      <h1>{is404 ? 'Page Not Found' : 'Something went wrong'}</h1>
      <p>{is404 ? 'This page does not exist.' : 'Please try again later.'}</p>
    </div>
  );
}
