import './index.css';
import Navbar from './components/Navbar';
import BoardPage from './pages/BoardPage';
import { BoardProvider } from './context/BoardContext';

function App() {
  return (
    <BoardProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <BoardPage />
      </div>
    </BoardProvider>
  );
}

export default App;
