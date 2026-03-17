import { useParams } from 'react-router-dom';

import ErrorPage from './ErrorPage';

function normalizeCode(raw: string | undefined) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 500;
  return Math.max(400, Math.min(599, Math.trunc(n)));
}

export default function ErrorRoute() {
  const { code } = useParams();
  const normalized = normalizeCode(code);

  // ErrorPage will pick localized title/message based on code.
  return <ErrorPage code={normalized} />;
}
