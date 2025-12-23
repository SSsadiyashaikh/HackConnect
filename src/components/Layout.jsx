import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pb-10 pt-4 sm:pt-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;


