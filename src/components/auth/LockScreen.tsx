import { useState, useRef } from 'react';

interface LockScreenProps {
  hasVault: boolean;
  onUnlock: (pin: string) => Promise<boolean>;
  onCreateVault: (pin: string) => Promise<void>;
  onImportBackup: (file: File) => Promise<void>;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  hasVault,
  onUnlock,
  onCreateVault,
  onImportBackup,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setError('Use exatamente 6 dígitos.');
      return;
    }

    if (hasVault) {
      if (Date.now() < lockedUntil) {
        setError('Muitas tentativas. Aguarde 30 segundos.');
        return;
      }
      try {
        await onUnlock(pin);
        setFails(0);
        setError('');
      } catch {
        const nextFails = fails + 1;
        setFails(nextFails);
        setPin('');
        if (nextFails >= 5) {
          setLockedUntil(Date.now() + 30_000);
          setError('Bloqueado por 30 segundos.');
          setTimeout(() => setFails(0), 30_000);
        } else {
          setError('PIN incorreto.');
        }
      }
    } else if (!confirmPin) {
      setConfirmPin(pin);
      setPin('');
      setError('');
    } else if (confirmPin !== pin) {
      setConfirmPin(null);
      setPin('');
      setError('Os PINs não conferem. Tente novamente.');
    } else {
      await onCreateVault(pin);
    }
  };

  const title = hasVault
    ? 'Bem-vinda de volta'
    : confirmPin
    ? 'Confirme o PIN'
    : 'Crie um PIN';

  const subtitle = hasVault
    ? 'Seus dados ficam salvos neste aparelho.'
    : confirmPin
    ? 'Digite o mesmo PIN novamente.'
    : 'Digite 6 dígitos. Ele protege e criptografa tudo neste aparelho. Não há como recuperar um PIN esquecido.';

  return (
    <div id="lock">
      <small className="k">Minhas Finanças</small>
      <h1 style={{ marginTop: 6 }}>{title}</h1>
      <p>{subtitle}</p>
      <form onSubmit={handleSubmit}>
        <input
          className="f"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
        <div className="err">{error}</div>
        <button type="submit" className="btn" style={{ maxWidth: 220 }}>
          {hasVault ? 'Entrar' : 'Continuar'}
        </button>
      </form>

      {!hasVault && !confirmPin && (
        <>
          <button
            type="button"
            className="ghost"
            style={{ marginTop: 16 }}
            onClick={() => fileRef.current?.click()}
          >
            Restaurar de um backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  await onImportBackup(file);
                } catch {
                  setError('Arquivo de backup inválido.');
                }
              }
            }}
          />
        </>
      )}
    </div>
  );
};
