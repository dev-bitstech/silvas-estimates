import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Catalog = { id:number; category:string; trade:string; item:string; unit:string; default_cost:number; cost_type:string; active:boolean };

export default function Admin(){
  const [role, setRole] = useState<'admin'|'field'>('field');
  const [rows, setRows] = useState<Catalog[]>([]);
  const [margin, setMargin] = useState<number>(parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MARGIN||'0.35'));

  useEffect(()=>{
    supabase.auth.getUser().then(async ({data})=>{
      if(!data.user){ location.href='/'; return; }
      // naive role check: fetch own profile
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if(prof?.role==='admin') setRole('admin'); else setRole('field');
      const { data: cat } = await supabase.from('catalog').select('*').order('category').order('trade');
      setRows(cat||[]);
    });
  },[]);

  const canEdit = role==='admin';

  async function updateRow(r:Catalog, patch: Partial<Catalog>){
    const next = { ...r, ...patch };
    setRows(rows.map(x=>x.id===r.id?next:x));
    if(!canEdit) return;
    await supabase.from('catalog').update({ default_cost: next.default_cost, active: next.active }).eq('id', r.id);
  }

  return (
    <div style={{maxWidth:1000, margin:'24px auto', padding:'0 16px'}}>
      <div className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <img src="/logo.png" alt="Silva's Contracting" width={120} height={36}/>
          <h2 style={{fontSize:20, fontWeight:600}}>Admin Panel</h2>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <div>Default Margin</div>
          <input className="input" type="number" step="0.01" value={margin} onChange={e=>setMargin(parseFloat(e.target.value)||0} />
          <button className="btn" onClick={()=>alert('Persist default margin via env or config table (not included).')}>Save</button>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <table className="table">
          <thead>
            <tr>
              <th className="th">Category</th>
              <th className="th">Trade</th>
              <th className="th">Item</th>
              <th className="th">Unit</th>
              <th className="th">Default Cost</th>
              <th className="th">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td className="td">{r.category}</td>
                <td className="td">{r.trade}</td>
                <td className="td">{r.item}</td>
                <td className="td">{r.unit}</td>
                <td className="td">
                  <input className="input" type="number" step="0.01" value={r.default_cost}
                    onChange={e=>updateRow(r, { default_cost: parseFloat(e.target.value)||0 })} disabled={!canEdit}/>
                </td>
                <td className="td">
                  <input type="checkbox" checked={r.active} onChange={e=>updateRow(r, { active: e.target.checked })} disabled={!canEdit} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {role!=='admin' && <div style={{marginTop:8, color:'#ef4444'}}>Somente administradores podem editar.</div>}
      </div>
    </div>
  );
}
