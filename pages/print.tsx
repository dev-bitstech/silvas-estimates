import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PrintPage(){
  const [project, setProject] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(()=>{
    const url = new URL(window.location.href);
    const projectId = url.searchParams.get('projectId');
    if(!projectId){ return; }
    (async ()=>{
      const { data: p } = await supabase.from('projects').select('*').eq('id', projectId).single();
      setProject(p);
      const { data: it } = await supabase.from('items').select('*').eq('project_id', projectId);
      setItems(it||[]);
      setTimeout(()=>window.print(), 800);
    })();
  },[]);

  return (
    <div style={{maxWidth:900, margin:'24px auto', padding:'0 16px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <img src="/logo.png" alt="Silva's Contracting" width={120} height={36}/>
          <h2 style={{fontSize:22}}>Estimate</h2>
        </div>
        <div style={{textAlign:'right', fontSize:12, color:'#6b7280'}}>
          <div>Silva's Contracting</div>
          <div>Generated: {new Date().toLocaleString()}</div>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <div><b>Project:</b> {project?.name}</div>
        <div><b>Type:</b> {project?.kind}</div>
        {project?.notes && <div><b>Notes:</b> {project?.notes}</div>}
      </div>

      <table style={{width:'100%', marginTop:12, borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Trade / Item</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Unit</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Qty</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Unit Cost</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i:any,idx:number)=>(
            <tr key={idx}>
              <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{i.trade} — {i.item}</td>
              <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{i.unit}</td>
              <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>{i.qty}</td>
              <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>${i.unit_cost}</td>
              <td style={{padding:'8px', borderBottom:'1px solid #f3f4f6'}}>${(i.qty||0)*(i.unit_cost||0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
