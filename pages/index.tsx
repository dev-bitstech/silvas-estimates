import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin'|'signup'>('signin');
  const [msg, setMsg] = useState('');

  useEffect(()=>{ supabase.auth.getUser().then(({data})=>{ if(data.user) location.href='/app'; }); },[]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.href = '/app';
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Conta criada. Faça login.');
        setMode('signin');
      }
    } catch (err:any) {
      setMsg(err.message || 'Erro');
    }
  }

  return (
    <div style={{maxWidth:420, margin:'64px auto', padding:'0 16px'}}>
      <div className="card" style={{display:'flex', gap:12, alignItems:'center'}}>
        <img src="/logo.png" alt="Silva's Contracting" width={140} height={40}/>
        <div style={{fontSize:12, textTransform:'uppercase', color:'#6b7280'}}>Silva's Contracting</div>
        <h1 style={{fontSize:22, fontWeight:600}}>Estimates (Beta)</h1>
      </div>

      <form className="card" onSubmit={onSubmit} style={{marginTop:16}}>
        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <button type="button" className="badge" onClick={()=>setMode('signin')} style={{fontWeight:mode==='signin'?600:400}}>Sign In</button>
          <button type="button" className="badge" onClick={()=>setMode('signup')} style={{fontWeight:mode==='signup'?600:400}}>Sign Up</button>
        </div>
        <input className="input" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <div style={{height:8}} />
        <input className="input" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div style={{height:16}} />
        <button className="btn" type="submit">{mode==='signin'?'Entrar':'Criar conta'}</button>
        {msg && <div style={{marginTop:8, color:'#ef4444'}}>{msg}</div>}
      </form>
      <div className="card" style={{marginTop:16, fontSize:12}}>
        <b>Dica:</b> Após criar as contas de admin e equipe, ajuste o campo <code>role</code> em <code>profiles</code> via Supabase.
      </div>
    </div>
  );
}
