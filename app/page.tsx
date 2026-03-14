import { redirect } from 'next/navigation';

// 根路径重定向到 /public 下的静态主页
export default function Home() {
  redirect('/index.html');
}
