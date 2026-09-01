import { supabase } from '../db.js';
import { scrapeRubinotCharacterPage } from '../lib/rubinotScraper.js';

export const runValidateMakers = async () => {
  try {
    // 1. Fetch pending validations
    const { data: queue, error: qErr } = await supabase
      .from('maker_validation_queue')
      .select('*')
      .eq('status', 'pending');

    if (qErr) throw qErr;
    if (!queue || queue.length === 0) return;

    // 2. Fetch Rules
    const { data: rules } = await supabase.from('maker_rules').select('*').limit(1).single();

    for (const job of queue) {
      try {
        // Mark as processing
        await supabase.from('maker_validation_queue').update({ status: 'processing' }).eq('id', job.id);

        console.log(`[VALIDATE MAKER] Validando: ${job.character_name}...`);

        // Fetch char data via Puppeteer
        const charData = await scrapeRubinotCharacterPage(job.character_name);
        if (!charData) {
          throw new Error('Personagem não encontrado.');
        }

        let isError = false;
        let errorMsg = '';

        if (rules && rules.is_mandatory) {
          // Level
          if (rules.min_level > 0 && charData.level < rules.min_level) {
            isError = true;
            errorMsg = `O Maker precisa ser level ${rules.min_level} ou superior (Atual: ${charData.level}).`;
          }
          
          // Vocation
          if (!isError && rules.allowed_vocations && rules.allowed_vocations.length > 0) {
            const voc = charData.vocation;
            if (!rules.allowed_vocations.some(v => v.toLowerCase() === voc.toLowerCase())) {
              isError = true;
              errorMsg = `Vocação não aceita. Vocações permitidas: ${rules.allowed_vocations.join(', ')}.`;
            }
          }
          
          // Guild
          if (!isError && rules.required_guild && rules.required_guild.trim().length > 0) {
            const charGuild = charData.guild ? charData.guild : '';
            if (charGuild.toLowerCase() !== rules.required_guild.toLowerCase()) {
              isError = true;
              errorMsg = `O Maker precisa estar na guilda "${rules.required_guild}".`;
            }
          }
          
          // World
          if (!isError && rules.required_world && rules.required_world.trim().length > 0) {
            const w = charData.world || '';
            if (w.toLowerCase() !== rules.required_world.toLowerCase()) {
              isError = true;
              errorMsg = `O Maker precisa estar no mundo "${rules.required_world}".`;
            }
          }
        }

        if (isError) {
          await supabase.from('maker_validation_queue').update({
            status: 'error',
            error_msg: errorMsg,
            level: charData.level,
            vocation: charData.vocation,
            guild: charData.guild,
            world: charData.world
          }).eq('id', job.id);
        } else {
          await supabase.from('maker_validation_queue').update({
            status: 'completed',
            error_msg: null,
            level: charData.level,
            vocation: charData.vocation,
            guild: charData.guild,
            world: charData.world
          }).eq('id', job.id);
        }
        
      } catch (err) {
        console.error(`[VALIDATE MAKER] Erro ao validar ${job.character_name}: ${err.message}`);
        await supabase.from('maker_validation_queue').update({
          status: 'error',
          error_msg: err.message
        }).eq('id', job.id);
      }
    }

  } catch (error) {
    console.error(`[VALIDATE MAKER] Erro fatal na task:`, error.message);
  }
};
