const MirrorQueueMonitor = ({ mirror }) => {
  if (!mirror) return <p>Waiting for initial data...</p>;
  let queue;
  if (mirror.queue.length == 0) {
    queue = <p>Queue empty</p>;
  } else {
    queue = (
      <ul>
        {mirror.queue.map(name => (
          <li>{name}</li>
        ))}
      </ul>
    );
  }
  return (
    <main>
      <p>Mirror running: {mirror.displaying || "No one"}</p>
      {queue}
    </main>
  );
};

export default MirrorQueueMonitor;
