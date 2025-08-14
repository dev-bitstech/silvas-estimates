# Silva's Contracting — Estimates (Beta) v2

Web app de estimativas com:
- Login (Supabase Auth)
- Catálogo de trades (Supabase)
- Upload de fotos (Supabase Storage, bucket `project-photos`)
- Painel Admin para editar custos do catálogo e margem padrão
- Exportar/Imprimir orçamento (página `print`) — opcional PDF via navegador ou jsPDF

## Deploy (Vercel + Supabase)
1. **Supabase**: crie um projeto e copie:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Em **SQL Editor**, rode em ordem:
   - `supabase/schema.sql`
   - `supabase/storage_policies.sql` (cria bucket e políticas de upload/leitura)
   - `supabase/seed.sql`
3. **Vercel**: importe este repositório/ZIP e configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEFAULT_MARGIN=0.35`
   - `NEXT_PUBLIC_STORAGE_BUCKET=project-photos`
4. **Deploy** e abra a URL.
5. **Contas**: Crie via Sign Up e ajuste `profiles.role`:
   - `fonseca@bitstech.solutions` → `admin`
   - `fieldteam@silvascontracting.com` → `field`

## Recursos
- `/` → Login / Sign Up
- `/app` → Criar projeto, itens, totalização, **upload de fotos** por projeto
- `/admin` → Editar **catálogo** (preço, ativo) e **margem padrão**
- `/print?projectId=...` → Visualização limpa para impressão/exportação (usa `window.print()`; opcional gerar PDF com jsPDF)

## Notas
- Storage: bucket **project-photos** precisa existir (script incluso).
- As políticas RLS/Storage estão abertas para usuários autenticados (ajuste conforme sua política).

# silvas-estimates
# silvas-estimates
# silvas-estimates
# silvas-estimates
