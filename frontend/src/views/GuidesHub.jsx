import React, { useState } from 'react';
import { 
  BookOpen, Shield, TrendingUp, Gem, Users, AlertTriangle, 
  CheckCircle2, Clock, User, ArrowLeft, ArrowRight, Share2, 
  Bookmark, Award, Search, Sparkles, ExternalLink 
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

export const ARTICLES = [
  {
    id: 'bazaar-arbitrage-guide',
    slug: 'guia-arbitragem-character-bazaar-rubinot',
    category: 'Bazaar & Economia',
    categoryIcon: 'Gem',
    title: 'Guia Definitivo do Character Bazaar no Rubinot: Avaliação de Chars, Arbitragem e Métricas de Compra',
    subtitle: 'Aprenda a analisar além do nível: skills, charms, quest flags e a fórmula matemática para identificar verdadeiras pechinchas antes de dar seu lance.',
    author: 'Equipe Editorial Rubinot Tracker',
    publishedAt: '12 de Setembro de 2026',
    readTime: '11 min de leitura',
    tags: ['Bazaar', 'Tibia Coins', 'Arbitragem', 'Economia', 'Sniper'],
    content: (
      <div className="space-y-6 text-gray-300 leading-relaxed">
        <p className="text-base text-gray-200">
          O <strong>Character Bazaar</strong> revolucionou a economia do Rubinot ao criar um mercado regulado, seguro e auditado para a compra e venda de personagens. No entanto, muitos jogadores ainda cometem o erro clássico de avaliar um guerreiro apenas pelo seu nível bruto, ignorando métricas que demandam meses de esforço manual ou centenas de Tibia Coins em treinamento offline e suprimentos.
        </p>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          1. O Tríplice Pilar da Avaliação Real: Skills, Charms e Quests
        </h3>
        <p>
          Ao garimpar leilões ativos no <em>Bazaar Sniper</em>, considere a seguinte hierarquia de valor acumulado:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">Skills e Magic Level:</strong> O custo de Magic Level para magos ou skills 115+ para Knights e Paladins cresce exponencialmente. Treinar um Magic Level do 100 ao 110 consome muito mais tempo e gold do que upar do level 300 ao 500. Portanto, um char level 450 com Magic Level 105 muitas vezes vale mais do que um level 550 com Magic Level 92.
          </li>
          <li>
            <strong className="text-white">Charm Points & Runas Desbloqueadas:</strong> Charms de ataque (Freeze, Zap, Wound, Curse) e suporte (Dodge, Adrenaline Burst) são vitais para o meta de caçadas em grupo de alto nível. Cada criatura concluída no Bestiário demanda horas de farm. Um personagem com 4 a 6 runas já ativas economiza meses de rotina cansativa.
          </li>
          <li>
            <strong className="text-white">Acessos a Bosses e Quests Chave:</strong> Verifique se o personagem possui acessos concluídos a áreas cruciais como <em>Soul War, Rotten Blood, Falcon Bastion, Cobra Bastion e Timira</em>. Personagens sem acessos exigem investimento de tempo e suporte de guilda para liberação.
          </li>
        </ul>

        <div className="my-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          <div className="font-bold flex items-center gap-2 mb-1">
            <Sparkles size={16} /> Regra de Ouro do Sniper
          </div>
          Se o lance inicial estiver em torno de 50 a 100 Tibia Coins para um personagem com mais de 3.000 Charm Points ou skill relevante, a chance de arbitragem com revenda ou economia própria imediata é superior a 300%.
        </div>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          2. A Fórmula da "Tabela FIPE" de Personagens
        </h3>
        <p>
          Em nosso módulo <strong>Bazaar Sniper</strong>, aplicamos um algoritmo de valor base estimado que considera o custo de oportunidade:
        </p>
        <div className="p-4 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-green-400">
          Valor Justo (TC) = (Level × 1.25) + (Charm Points × 0.15) + Modificador_Skill + Modificador_Mundo
        </div>
        <p className="mt-2 text-sm">
          Servidores Retro-PvP costumam apresentar uma taxa de risco maior, o que aumenta a demanda por personagens com alta velocidade de locomoção e capacidade de suporte em combate aberto.
        </p>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          3. Riscos Ocultos e Cuidados Pré-Lance
        </h3>
        <p>
          Antes de confirmar qualquer transferência de moedas, certifique-se de:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Consultar o nome do personagem no nosso <em>Monitor Global de Jogadores</em> e <em>Mural de Mortes</em> para verificar se o personagem não possui histórico recente de mortes intencionais (anti-jogo) ou status de caçado (<em>hunted</em>) por alianças dominantes.</li>
          <li>Calcular os custos caso planeje transferir o personagem para outro mundo. Lembre-se que regras de transferência entre Retro, Open e Optional-PvP impõem restrições de sentido único.</li>
        </ol>
      </div>
    )
  },
  {
    id: 'rubinot-16-worlds-tactical-overview',
    slug: 'panorama-16-mundos-rubinot-pvp-economia',
    category: 'Táticas & Mundos',
    categoryIcon: 'Shield',
    title: 'Panorama Tático dos 16 Mundos de Rubinot: Tipos de PvP, Economia e Estilo de Comunidade',
    subtitle: 'Um estudo aprofundado comparando os servidores Retro-PvP, Open-PvP e Optional-PvP para guiar sua escolha de jornada ou transferência de servidor.',
    author: 'Equipe Editorial Rubinot Tracker',
    publishedAt: '10 de Setembro de 2026',
    readTime: '14 min de leitura',
    tags: ['Mundos', 'PvP', 'Retro-PvP', 'Servidores', 'Economia'],
    content: (
      <div className="space-y-6 text-gray-300 leading-relaxed">
        <p className="text-base text-gray-200">
          A rede Rubinot conta atualmente com <strong>16 servidores oficiais</strong>, cada qual apresentando peculiaridades de regras de combate, velocidade de progressão, demografia e liquidez econômica. Escolher o servidor correto é o passo mais determinante para o sucesso e diversão de um jogador ou guilda.
        </p>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          1. Os Três Modos de Combate Explicados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30">
            <h4 className="font-medieval font-bold text-red-400 text-base mb-1">💀 Retro-PvP</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Sem sistema de ghost walk (jogadores colidem em qualquer piso). Possibilidade de traps com Magic Wall e campos de runas que atingem todos ao redor. Alta adrenalina e domínio militar rigoroso.
            </p>
            <div className="text-[11px] text-yellow-500/90 font-mono mt-3">
              Mundos: Infernum I, II, III, Bellum, Tenebrium
            </div>
          </div>
          <div className="p-4 rounded-xl bg-yellow-950/30 border border-yellow-500/30">
            <h4 className="font-medieval font-bold text-yellow-400 text-base mb-1">⚔️ Open-PvP</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Equilíbrio entre combate tático e regras de skull. Sistema de Justified Frags com proteção para jogadores neutros, permitindo batalhas de warmode formais e disputas territoriais dinâmicas.
            </p>
            <div className="text-[11px] text-yellow-500/90 font-mono mt-3">
              Mundos: Auroria, Belaria, Drakaria, Malveria, Vesperia
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <h4 className="font-medieval font-bold text-blue-400 text-base mb-1">🛡️ Optional-PvP</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Combate direto restrito a guerras de guilda consentidas. Foco total em Power Leveling, completude de Bestiário, comércio de itens raros e corridas nas Highscores de experiência.
            </p>
            <div className="text-[11px] text-yellow-500/90 font-mono mt-3">
              Mundos: Eldrian, Elysian, Lunarian, Mystian, Obsidian, Solarian
            </div>
          </div>
        </div>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          2. A Dinâmica Econômica e Valor das Tibia Coins
        </h3>
        <p>
          Em servidores Optional-PvP como <em>Lunarian</em> e <em>Solarian</em>, a ausência de atrito mortal frequente reduz a destruição de suprimentos em guerras, elevando o acúmulo de gold e resultando em cotações de Tibia Coins mais altas no mercado in-game. Por outro lado, mundos de Retro-PvP como <em>Infernum</em> e <em>Bellum</em> sustentam uma economia vigorosa de compra e venda de personagens de guerra e suprimentos rápidos.
        </p>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          3. Como o Rubinot Tracker Conecta os 16 Mundos
        </h3>
        <p>
          Através da nossa rede de workers e telemetria aberta, qualquer jogador pode alternar seu servidor ativo no menu superior para comparar rankings de experiência, taxas de mortes nas últimas 24 horas e oportunidades no Bazaar em tempo real.
        </p>
      </div>
    )
  },
  {
    id: 'party-hunt-efficiency-loot-split',
    slug: 'guia-eficiencia-party-hunts-divisao-loot',
    category: 'Hunts & Gestão',
    categoryIcon: 'Users',
    title: 'Manual de Alta Eficiência em Party Hunts: Otimização de XP, Cálculo de Waste e Divisão Justa de Lucros',
    subtitle: 'Passo a passo matemático para gerenciar caçadas de 4 vocações sem atritos, calculando imbuements, suprimentos e transferências bancárias com precisão cirúrgica.',
    author: 'Equipe Editorial Rubinot Tracker',
    publishedAt: '08 de Setembro de 2026',
    readTime: '10 min de leitura',
    tags: ['Hunts', 'Party', 'Loot Split', 'Economia', 'Elder Druid', 'Elite Knight'],
    content: (
      <div className="space-y-6 text-gray-300 leading-relaxed">
        <p className="text-base text-gray-200">
          No meta moderno do Rubinot, a progressão mais rápida de experiência e acúmulo de riqueza é obtida através de <strong>Party Hunts de 4 vocações</strong> (Elite Knight, Elder Druid, Royal Paladin e Master Sorcerer). No entanto, gerenciar a contabilidade de uma caçada de 2 horas pode se tornar um pesadelo logístico caso a equipe não adote métodos transparentes e automatizados.
        </p>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          1. A Fórmula do Lucro Líquido Real
        </h3>
        <p>
          Para que a divisão de loot seja equitativa, o cálculo deve seguir estritamente o princípio do reembolso integral de custos individuais:
        </p>
        <div className="p-4 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-yellow-300 space-y-1">
          <div>Loot Bruto = Soma do valor dos itens dropados (mercado ou NPC)</div>
          <div>Waste Total = Suprimentos gastos (Potions + Runas + Munição) de todos os 4 membros</div>
          <div className="text-green-400 font-bold">Lucro Líquido = Loot Bruto - Waste Total</div>
          <div className="text-cyan-400">Parte Individual = Lucro Líquido ÷ Número de Membros</div>
        </div>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          2. A Questão dos Imbuements de Tier 3
        </h3>
        <p>
          Um dos maiores pontos de debate entre jogadores é se os custos de imbuements devem entrar na conta do waste da party. A recomendação padrão adotada pelas maiores guildas é:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">Para caçadas com foco em Lucro (Profit Hunts):</strong> O custo por hora de imbuements (geralmente entre 15k e 25k por hora por slot ativado) pode ser descontado do loot bruto antes do cálculo do lucro líquido, desde que acordado por todos os membros previamente.
          </li>
          <li>
            <strong className="text-white">Para caçadas com foco em Experiência Máxima (XP Rush):</strong> Cada jogador absorve seus próprios imbuements como investimento pessoal na evolução do seu personagem, dividindo apenas potions e runas diretamente consumidas na sessão.
          </li>
        </ul>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          3. Sinergia de Vocação no Respawns de Pico
        </h3>
        <p>
          A eficiência de dano por segundo (DPS) de uma party depende da sobreposição de turnos de magias em área:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <strong className="text-yellow-400">Knight & Druid:</strong> Posicionamento do box e sincronia milimétrica de <em>Exori Gran</em> com o <em>Mass Sio</em> para evitar picos de dano súbito.
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <strong className="text-yellow-400">Paladin & Sorcerer:</strong> <em>Mas San</em> + <em>Great Fireball/Thunderstorm</em> combinados com o debuff de <em>Exori Mas / Exposed</em> do Sorcerer para amplificar o dano elemental coletivo.
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'telemetry-death-wall-pvp-intelligence',
    slug: 'telemetria-mural-de-mortes-inteligencia-combate',
    category: 'Inteligência & Warmode',
    categoryIcon: 'TrendingUp',
    title: 'Inteligência de Combate & Warmode: Como Interpretar a Telemetria e Prever Conflitos no Servidor',
    subtitle: 'Como grandes alianças e líderes militares utilizam dados de mortes em tempo real, detecção de logins e estatísticas de frag para dominar cenários de batalha.',
    author: 'Equipe Editorial Rubinot Tracker',
    publishedAt: '05 de Setembro de 2026',
    readTime: '12 min de leitura',
    tags: ['Warmode', 'Telemetria', 'Mortes', 'Inteligência', 'Frags', 'PvP'],
    content: (
      <div className="space-y-6 text-gray-300 leading-relaxed">
        <p className="text-base text-gray-200">
          A guerra em servidores contemporâneos do Rubinot não é vencida apenas no campo de batalha com reflexos rápidos; ela é definida pela <strong>vantagem de informação</strong>. Saber quando o inimigo está caçando distraído, monitorar o login em massa de personagens secundários (<em>makers</em>) e auditar mortes suspeitas são práticas fundamentais de quem lidera alianças dominantes.
        </p>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          1. Decodificando Mortes no Mural do Rubinot Tracker
        </h3>
        <p>
          O <strong>Mural de Mortes em Tempo Real</strong> não é apenas uma lista de obituários; ele revela a saúde e o atrito do servidor:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-white">Picos Anormais de Mortes PvE em High Levels:</strong> Quando jogadores de nível 600+ começam a morrer seguidamente para criaturas comuns em curtos intervalos, geralmente isso indica a presença de um time rival aplicando <em>luring</em>, empurrando monstros ou fechando rotas de fuga.
          </li>
          <li>
            <strong className="text-white">Makers e Desgaste de Frags:</strong> Em servidores Open-PvP, mortes intencionais de bonecos de level baixo sem guilda costumam sinalizar tentativas de forçar <em>Red Skull</em> ou <em>Black Skull</em> em membros desprevenidos da aliança adversária.
          </li>
        </ul>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          2. O Princípio Zero-Trust na Telemetria Militar
        </h3>
        <p>
          Nosso motor de telemetria baseia-se em nós descentralizados (Workers) que coletam o estado da lista de jogadores online e das tabelas de pontuação sem depender de relatórios declaratórios manuais. Isso garante que as informações disponíveis no <em>Radar de Inimigos</em> e no <em>Mural de Mortes</em> reflitam com precisão cirúrgica a realidade factual do servidor.
        </p>
      </div>
    )
  },
  {
    id: 'account-security-cyber-hygiene',
    slug: 'seguranca-contas-autenticacao-protecao-golpes',
    category: 'Segurança & Boas Práticas',
    categoryIcon: 'AlertTriangle',
    title: 'Segurança de Contas no Rubinot: Autenticação em Duas Etapas, Prevenção de Phishing e Proteção de Patrimônio',
    subtitle: 'Um manual essencial de higiene cibernética para proteger seus personagens, moedas e itens raros contra as ameaças e golpes mais comuns da internet.',
    author: 'Equipe Editorial Rubinot Tracker',
    publishedAt: '01 de Setembro de 2026',
    readTime: '9 min de leitura',
    tags: ['Segurança', 'Autenticação', '2FA', 'Phishing', 'Contas', 'Privacidade'],
    content: (
      <div className="space-y-6 text-gray-300 leading-relaxed">
        <p className="text-base text-gray-200">
          Personagens de alto nível e coleções de itens raros representam centenas ou milhares de horas de dedicação e, muitas vezes, valor financeiro substancial. Por essa razão, a comunidade de jogos online é alvo contínuo de tentativas de engenharia social, clonagem de domínios e softwares maliciosos disfarçados de utilitários.
        </p>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          1. As Três Barreiras Fundamentais de Proteção
        </h3>
        <div className="space-y-4 my-4">
          <div className="p-4 rounded-xl bg-black/50 border border-green-500/30 flex gap-3">
            <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={20} />
            <div>
              <strong className="text-white block text-sm mb-1">1. Autenticação de Dois Fatores (2FA) via Aplicativo</strong>
              <p className="text-xs text-gray-300 leading-relaxed">
                Utilize sempre geradores de código baseados em tempo (TOTP), como Google Authenticator, Authy ou 1Password. Nunca compartilhe códigos de uso único, mesmo com administradores de servidores ou amigos de guilda.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-yellow-500/30 flex gap-3">
            <CheckCircle2 className="text-yellow-400 shrink-0 mt-0.5" size={20} />
            <div>
              <strong className="text-white block text-sm mb-1">2. E-mail de Recuperação Exclusivo e Protegido</strong>
              <p className="text-xs text-gray-300 leading-relaxed">
                O e-mail vinculado à sua conta de jogo deve possuir uma senha única que não seja usada em nenhum outro fórum, rede social ou site. A perda do acesso ao e-mail compromete todas as contas associadas.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-red-500/30 flex gap-3">
            <CheckCircle2 className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div>
              <strong className="text-white block text-sm mb-1">3. Chave de Recuperação (Recovery Key) em Local Físico</strong>
              <p className="text-xs text-gray-300 leading-relaxed">
                Anote sua Recovery Key em papel e guarde-a em local seguro. Evite salvar fotos ou arquivos de texto com a chave em serviços de nuvem desprotegidos ou pastas compartilhadas do computador.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-medieval text-yellow-400 font-bold mt-8 pb-2 border-b border-yellow-500/20">
          2. Como Identificar Tentativas de Phishing
        </h3>
        <p>
          Golpistas frequentemente criam páginas falsas idênticas aos portais de jogo, oferecendo "sorteios falsos de Tibia Coins" ou "mudanças obrigatórias de senha".
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Sempre confira a URL na barra de navegação antes de digitar suas credenciais.</li>
          <li>O <strong>Rubinot Tracker</strong> nunca solicita a senha da sua conta de jogo ou sua chave de recuperação. Nossa autenticação utiliza contas seguras e independentes.</li>
        </ul>
      </div>
    )
  }
];

export default function GuidesHub({ onNavigate, initialArticleId }) {
  const [selectedArticleId, setSelectedArticleId] = useState(initialArticleId || null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['ALL', 'Bazaar & Economia', 'Táticas & Mundos', 'Hunts & Gestão', 'Inteligência & Warmode', 'Segurança & Boas Práticas'];

  const filteredArticles = ARTICLES.filter(art => {
    const matchCat = categoryFilter === 'ALL' || art.category === categoryFilter;
    const matchSearch = !searchQuery || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const activeArticle = ARTICLES.find(a => a.id === selectedArticleId);

  // Se um artigo específico estiver aberto:
  if (activeArticle) {
    return (
      <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto text-gray-200 font-sans animate-fade-in">
        {/* Barra Superior de Navegação */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setSelectedArticleId(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer bg-black/40 border border-yellow-500/30 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft size={14} /> Voltar aos Artigos & Guias
          </button>
          <span className="text-xs text-gray-500 font-mono">
            Publicação Oficial Rubinot Tracker
          </span>
        </div>

        {/* Artigo Completo */}
        <article className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Header do Artigo */}
          <div className="border-b border-white/10 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-3">
              <BookOpen size={13} /> {activeArticle.category}
            </div>
            <h1 className="text-2xl sm:text-4xl font-medieval text-gradient-gold drop-shadow-md leading-tight mb-3">
              {activeArticle.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed mb-4">
              {activeArticle.subtitle}
            </p>
            
            {/* Metadados Editoriais */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-sans pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-yellow-300">
                <User size={14} /> {activeArticle.author}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} /> {activeArticle.publishedAt}
              </div>
              <div className="flex items-center gap-1.5 text-green-400">
                <Award size={14} /> {activeArticle.readTime}
              </div>
            </div>
          </div>

          {/* Conteúdo Textual Rico */}
          <div className="text-sm sm:text-base">
            {activeArticle.content}
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap gap-1.5">
            {activeArticle.tags.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400">
                #{t}
              </span>
            ))}
          </div>

          {/* Banner AdSense de Rodapé de Conteúdo Editorial */}
          <div className="pt-4">
            <AdBanner slot="editorial-article-footer" format="auto" />
          </div>

          {/* Navegação entre outros artigos */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => setSelectedArticleId(null)}
              className="inline-flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <ArrowLeft size={14} /> Explorar outros guias
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Voltar à Página Principal <ArrowRight size={14} />
              </button>
            )}
          </div>
        </article>
      </div>
    );
  }

  // Lista Principal de Artigos & Guias
  return (
    <div className="p-4 sm:p-8 w-full max-w-6xl mx-auto text-gray-200 font-sans animate-fade-in">
      
      {/* Banner de Topo / Header */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BookOpen size={14} /> Enciclopédia & Central de Inteligência
        </div>
        <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-md">
          Guias, Estratégias & Artigos
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed">
          Análises aprofundadas sobre a economia de leilões, táticas de combate nos 16 mundos de Rubinot, otimização de party hunts e segurança cibernética.
        </p>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar artigo, mecânica, mundo ou termo de jogo..."
            className="w-full bg-black/60 border border-yellow-500/40 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-400 shadow-inner"
          />
        </div>

        {/* Chips de Categorias */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medieval transition-all ${
                categoryFilter === cat
                  ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 shadow-md scale-105'
                  : 'bg-black/40 text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'Todos os Guias' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Artigos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {filteredArticles.map((art) => (
          <div 
            key={art.id}
            onClick={() => setSelectedArticleId(art.id)}
            className="group bg-tibia-card border-2 border-tibia-border hover:border-yellow-500/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-bold">
                  {art.category}
                </span>
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> {art.readTime}
                </span>
              </div>

              <h2 className="text-xl font-medieval text-white group-hover:text-yellow-400 transition-colors mb-2 leading-snug">
                {art.title}
              </h2>

              <p className="text-xs sm:text-sm text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                {art.subtitle}
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-gray-500">{art.publishedAt}</span>
              <span className="text-yellow-400 group-hover:text-yellow-300 font-bold flex items-center gap-1">
                Ler Artigo Completo <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Banner de Anúncio entre Conteúdos */}
      <div className="my-8">
        <AdBanner slot="guides-hub-bottom" format="horizontal" />
      </div>

      {/* Rodapé Informativo */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-center max-w-2xl mx-auto text-xs text-gray-400 space-y-2">
        <div className="font-medieval text-sm text-yellow-400 font-bold">
          Quer contribuir com um guia ou sugerir pauta?
        </div>
        <p>
          Nosso conselho editorial recebe sugestões de jogadores veteranos e líderes de guilda. Entre em contato através do nosso repositório comunitário ou pela aba de suporte.
        </p>
      </div>

    </div>
  );
}
