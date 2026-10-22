import { useState } from 'react';
import { Plus, Pencil, ShieldCheck } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, phone, maskPhone } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, MoneyInput, PageHeader, Select, Spinner, Table, Toggle, useToast, ErrorBox, Badge } from '../components/ui.jsx';

export const ROLES = {
  admin: { label: 'Administrador', desc: 'Acesso total, inclusive usuários' },
  gerente: { label: 'Gerente', desc: 'Tudo, exceto usuários' },
  caixa: { label: 'Caixa / atendimento', desc: 'PDV, pedidos, caixa, encomendas, clientes, entregas' },
  cozinha: { label: 'Cozinha', desc: 'Tela da cozinha, pedidos e encomendas' },
  entregador: { label: 'Entregador', desc: 'Só o app do entregador' },
};

export default function UsersPage() {
  const list = useApi('/users');
  const [edit, setEdit] = useState(null);
  return (
    <>
      <PageHeader title="Usuários" subtitle="Cada pessoa da equipe com seu login e o que pode acessar">
        <Button icon={Plus} onClick={() => setEdit({ name: '', login: '', role: 'caixa', phone: '', delivery_fee_cents: 0, active: 1 })}>Novo usuário</Button>
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          {!list.data ? <Spinner /> : (
            <Table>
              <thead><tr><th>Nome</th><th>Login</th><th>Perfil</th><th>Telefone</th><th /></tr></thead>
              <tbody>
                {list.data.map((u) => (
                  <tr key={u.id} className={u.active ? '' : 'opacity-50'}>
                    <td className="font-medium">{u.name}</td>
                    <td className="font-mono text-sm">{u.login}</td>
                    <td><Badge className="bg-brand-50 text-brand-700 ring-brand-100">{ROLES[u.role]?.label}</Badge>{u.role === 'entregador' && u.delivery_fee_cents > 0 && <span className="ml-2 text-xs text-stone-500">{brl(u.delivery_fee_cents)}/entrega</span>}</td>
                    <td>{phone(u.phone)}</td>
                    <td className="text-right"><Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEdit(u)} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card className="h-fit space-y-2 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-brand-500" /> Perfis</p>
          {Object.values(ROLES).map((r) => <p key={r.label}><b>{r.label}:</b> <span className="text-stone-600">{r.desc}</span></p>)}
        </Card>
      </div>
      {edit && <UserModal user={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); list.reload(); }} />}
    </>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const [f, setF] = useState({ ...user, phone: maskPhone(user.phone || ''), password: '' });
  const [err, setErr] = useState('');
  const toast = useToast();
  const save = async () => {
    try {
      const body = { ...f, phone: f.phone.replace(/\D/g, '') };
      if (f.id) await api.put(`/users/${f.id}`, body);
      else await api.post('/users', body);
      toast('Usuário salvo');
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal open onClose={onClose} title={f.id ? 'Editar usuário' : 'Novo usuário'} footer={<Button onClick={save}>Salvar</Button>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Login"><Input value={f.login} onChange={(e) => setF({ ...f, login: e.target.value.toLowerCase().replace(/\s/g, '') })} autoCapitalize="none" /></Field>
        <Field label="Perfil" className="sm:col-span-2" hint={ROLES[f.role]?.desc}>
          <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
        </Field>
        <Field label="Telefone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })} inputMode="tel" /></Field>
        {f.role === 'entregador' && <Field label="Valor pago por entrega"><MoneyInput value={f.delivery_fee_cents} onChange={(v) => setF({ ...f, delivery_fee_cents: v })} /></Field>}
        <Field label={f.id ? 'Nova senha (deixe em branco para manter)' : 'Senha'} className="sm:col-span-2" hint="Mínimo de 6 caracteres">
          <Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
        </Field>
        {f.id && <Toggle checked={!!f.active} onChange={(v) => setF({ ...f, active: v ? 1 : 0 })} label="Ativo (pode entrar no sistema)" />}
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}
