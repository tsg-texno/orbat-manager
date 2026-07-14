'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginOverlay() {
  const { users, registerUser, login } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPin2, setRegPin2] = useState('');

  const handleLogin = () => {
    setError('');
    if (!pin.trim()) { setError('Введите ПИН-код'); return; }
    const ok = login(pin.trim());
    if (!ok) setError('Неверный ПИН-код');
  };

  const handleRegister = () => {
    setError('');
    if (!regName.trim()) { setError('Введите имя'); return; }
    if (regPin.length < 3) { setError('ПИН-код должен быть минимум 3 символа'); return; }
    if (regPin !== regPin2) { setError('ПИН-коды не совпадают'); return; }
    if (users.some(u => u.pin === regPin)) { setError('Такой ПИН-код уже занят'); return; }
    registerUser(regName.trim(), regPin);
  };

  const isFirst = users.length === 0;

  if (!registering) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">ORBAT Manager</CardTitle>
            {isFirst && <p className="text-sm text-muted-foreground mt-1">Создайте первую учётную запись администратора</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">ПИН-код</label>
              <Input type="password" value={pin} onChange={e => setPin(e.target.value)}
                placeholder="Введите ПИН-код" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleLogin}>Войти</Button>
            <Button variant="link" className="w-full text-sm" onClick={() => { setRegistering(true); setError(''); }}>
              {isFirst ? 'Создать учётную запись' : 'Нет аккаунта? Зарегистрироваться'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{isFirst ? 'Создание администратора' : 'Регистрация'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Имя (позывной)</label>
            <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ваш позывной" />
          </div>
          <div>
            <label className="text-sm font-medium">ПИН-код</label>
            <Input type="password" value={regPin} onChange={e => setRegPin(e.target.value)} placeholder="Минимум 3 символа" />
          </div>
          <div>
            <label className="text-sm font-medium">Повторите ПИН-код</label>
            <Input type="password" value={regPin2} onChange={e => setRegPin2(e.target.value)} placeholder="Повторите" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleRegister}>{isFirst ? 'Создать' : 'Зарегистрироваться'}</Button>
          <Button variant="link" className="w-full text-sm" onClick={() => { setRegistering(false); setError(''); }}>
            Назад к входу
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}