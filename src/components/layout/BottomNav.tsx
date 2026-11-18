import { ActiveTab } from '../../types/finance';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAdd,
}) => {
  return (
    <nav id="nav">
      <button
        type="button"
        className={activeTab === 'home' ? 'on' : ''}
        onClick={() => onChangeTab('home')}
      >
        Início
      </button>
      <button
        type="button"
        className={activeTab === 'ext' ? 'on' : ''}
        onClick={() => onChangeTab('ext')}
      >
        Extrato
      </button>
      <button
        type="button"
        className="fab"
        onClick={onOpenAdd}
        aria-label="Adicionar"
      >
        +
      </button>
      <button
        type="button"
        className={activeTab === 'bills' ? 'on' : ''}
        onClick={() => onChangeTab('bills')}
      >
        Contas
      </button>
    </nav>
  );
};
