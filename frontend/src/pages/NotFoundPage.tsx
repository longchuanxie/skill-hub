import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
    <h1 className="text-6xl font-bold">404</h1>
    <p className="text-lg text-muted-foreground">页面不存在或已被移动。</p>
    <Link to="/" className="text-primary underline">返回首页</Link>
  </div>
);

export default NotFoundPage;
