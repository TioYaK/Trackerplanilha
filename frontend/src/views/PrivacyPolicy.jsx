import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onNavigate }) {
  return (
    <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto text-gray-200 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        {onNavigate && (
          <button
            onClick={() => onNavigate('home')}
            className="mb-4 inline-flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar à Página Inicial
          </button>
        )}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Shield size={14} /> Segurança & Transparência
        </div>
        <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold drop-shadow-md">
          Política de Privacidade
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Última atualização: 13 de Setembro de 2026 • Em conformidade com as diretrizes do Google AdSense e LGPD
        </p>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-8 bg-tibia-card border-2 border-tibia-border rounded-xl p-6 sm:p-8 shadow-xl text-sm leading-relaxed">
        
        {/* Seção 1 */}
        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <Eye size={18} className="text-yellow-400" />
            1. Informações Gerais e Finalidade
          </h2>
          <p className="text-gray-300">
            A plataforma <strong>Rubinot Tracker</strong> (<a href="https://trackerplanilha.vercel.app" className="text-yellow-400 hover:underline">trackerplanilha.vercel.app</a>) é um portal comunitário independente dedicado ao monitoramento de dados públicos em tempo real, estatísticas de combate, pontuações e suporte a guildas nos servidores do jogo Rubinot.
          </p>
          <p className="text-gray-300 mt-2">
            Esta Política de Privacidade esclarece como tratamos informações de navegação, o uso de cookies, a exibição de publicidade veiculada por terceiros (incluindo o Google AdSense) e a salvaguarda da sua privacidade durante o uso da plataforma.
          </p>
        </section>

        {/* Seção 2: Dados Coletados */}
        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <Lock size={18} className="text-yellow-400" />
            2. Coleta de Informações
          </h2>
          <p className="text-gray-300">
            O Rubinot Tracker não coleta dados pessoais sensíveis (como números de documentos, senhas in-game ou dados bancários). Os dados processados dividem-se em:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1.5 text-gray-300 ml-2">
            <li>
              <strong>Dados Públicos de Telemetria do Jogo:</strong> Informações públicas disponibilizadas pelos servidores oficiais do Rubinot, tais como nomes de personagens, níveis, vocações, mortes recentes e composições de guildas.
            </li>
            <li>
              <strong>Armazenamento Local no Navegador (LocalStorage):</strong> Identificadores anônimos de sessão técnica (como preferências de tema, mundo selecionado e ID de solicitação de convites) armazenados exclusivamente no seu dispositivo para conveniência de navegação.
            </li>
            <li>
              <strong>Logs de Servidor e Métricas:</strong> Endereço IP anonimizado, tipo de navegador, sistema operacional e páginas acessadas para controle de estabilidade, prevenção contra ataques DDoS e monitoramento de carga.
            </li>
          </ul>
        </section>

        {/* Seção 3: GOOGLE ADSENSE & COOKIES (OBRIGATÓRIO PELO GOOGLE) */}
        <section className="p-5 rounded-xl bg-yellow-950/20 border border-yellow-500/40 shadow-inner">
          <h2 className="text-lg font-medieval font-bold text-yellow-400 flex items-center gap-2 mb-3">
            <Shield size={18} className="text-yellow-400" />
            3. Publicidade do Google AdSense e Cookies de Terceiros
          </h2>
          <p className="text-gray-300">
            Utilizamos fornecedores terceiros, incluindo o <strong>Google</strong>, para veicular anúncios quando você visita nosso website:
          </p>
          <ul className="list-disc list-inside mt-2.5 space-y-2 text-gray-300 ml-2">
            <li>
              <strong>Cookies da DoubleClick / Google:</strong> O Google, como fornecedor de terceiros, utiliza cookies para veicular anúncios neste site com base nas visitas anteriores do usuário a este ou a outros sites na Internet.
            </li>
            <li>
              <strong>Publicidade Personalizada:</strong> O uso de cookies de publicidade pelo Google permite que ele e seus parceiros veiculem anúncios com base nas visitas feitas ao Rubinot Tracker e/ou a outros sites na web.
            </li>
            <li>
              <strong>Desativação da Personalização (Opt-Out):</strong> Os usuários podem desativar a publicidade personalizada acessando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline font-bold">Configurações de Anúncios do Google</a>.
            </li>
            <li>
              Alternativamente, os usuários podem optar por não usar cookies de terceiros para publicidade personalizada acessando o portal internacional <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline font-bold">www.aboutads.info</a> ou o portal europeu <a href="https://youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline font-bold">Your Online Choices</a>.
            </li>
          </ul>
        </section>

        {/* Seção 4: Cookies e Tecnologias Semelhantes */}
        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <FileText size={18} className="text-yellow-400" />
            4. Gerenciamento de Cookies
          </h2>
          <p className="text-gray-300">
            Você pode configurar seu navegador para recusar todos os cookies ou para alertá-lo quando um cookie estiver sendo enviado. Caso opte por desabilitar cookies em seu navegador, algumas funcionalidades técnicas do site (como manter filtros de mundo salvos) podem operar de forma limitada.
          </p>
        </section>

        {/* Seção 5: Segurança e Não-Compartilhamento */}
        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-green-400" />
            5. Compartilhamento de Informações
          </h2>
          <p className="text-gray-300">
            O Rubinot Tracker <strong>não vende, aluga ou compartilha</strong> dados pessoais de usuários com quaisquer empresas, corretores de dados ou entidades com fins comerciais, limitando-se estritamente à operação técnica da plataforma e aos provedores de serviços de infraestrutura (Vercel, Supabase e Google Cloud).
          </p>
        </section>

        {/* Seção 6: Isenção de Responsabilidade de Jogo */}
        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-yellow-400" />
            6. Direitos e Isenção de Marcas
          </h2>
          <p className="text-gray-300">
            Tibia é uma marca registrada de CipSoft GmbH. Rubinot é um servidor independente de jogo. O Rubinot Tracker é um software comunitário sem fins lucrativos oficiais, sem afiliação direta ou aprovação formal por parte da CipSoft GmbH ou da administração oficial do Rubinot.
          </p>
        </section>

        {/* Seção 7: Contato */}
        <section className="pt-4 border-t border-white/10">
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight mb-2">
            7. Contato com os Desenvolvedores
          </h2>
          <p className="text-gray-300">
            Em caso de dúvidas a respeito desta Política de Privacidade ou para solicitar esclarecimentos sobre dados públicos catalogados, entre em contato pelo e-mail:
          </p>
          <div className="mt-2 text-yellow-400 font-mono text-xs">
            pifot16@gmail.com
          </div>
        </section>

      </div>
    </div>
  );
}
