import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('dune-reference')
  .setDescription('Quick reference for Dune 2d20 skills and drives')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('What to reference')
      .setRequired(true)
      .addChoices(
        { name: 'Skills - Combat, social, mental abilities', value: 'skills' },
        { name: 'Drives - Core motivations and beliefs', value: 'drives' },
        { name: 'Both - Skills and drives together', value: 'both' }
      ));

export async function execute(interaction: ChatInputCommandInteraction) {
  const type = interaction.options.getString('type', true);
  
  const embed = new EmbedBuilder()
    .setColor('#8B4513')
    .setTimestamp()
    .setFooter({ text: 'Dune: Adventures in the Imperium Reference' });

  if (type === 'skills' || type === 'both') {
    embed.setTitle('🗡️ Dune 2d20 Skills Reference');
    embed.setDescription('The five core skills used in Dune: Adventures in the Imperium');
    
    embed.addFields(
      {
        name: '⚔️ Battle',
        value: 'Combat prowess and tactics, both armed and unarmed. Used for fighting, military strategy, and survival in dangerous situations.',
        inline: false
      },
      {
        name: '🗣️ Communicate', 
        value: 'Diplomacy, persuasion, negotiation, and deception. Used for social interactions, leadership, and manipulation.',
        inline: false
      },
      {
        name: '🧠 Discipline',
        value: 'Willpower, self-control, and mental fortitude. Used for resisting mental influence, maintaining focus, and controlling emotions.',
        inline: false
      },
      {
        name: '🏃 Move',
        value: 'Physical agility, mobility, piloting, and survival. Used for athletics, stealth, vehicle operation, and navigating harsh environments.',
        inline: false
      },
      {
        name: '🔍 Understand',
        value: 'Perception, investigation, deduction, and analysis. Used for gathering information, solving puzzles, and comprehending complex situations.',
        inline: false
      }
    );
  }

  if (type === 'drives' || type === 'both') {
    if (type === 'both') {
      embed.addFields({ name: '\u200B', value: '\u200B', inline: false }); // Spacer
    } else {
      embed.setTitle('💫 Dune 2d20 Drives Reference');
      embed.setDescription('The five core drives that motivate characters in the Imperium');
    }
    
    embed.addFields(
      {
        name: '🛡️ Duty',
        value: 'Loyalty to House or cause above all else. Represents dedication to responsibilities, oaths, and obligations.',
        inline: false
      },
      {
        name: '🙏 Faith',
        value: 'Trust in religion, tradition, or a higher power. Represents spiritual beliefs and adherence to doctrine.',
        inline: false
      },
      {
        name: '⚖️ Justice',
        value: 'Belief in fairness, law, and moral order. Represents the desire to right wrongs and uphold principles.',
        inline: false
      },
      {
        name: '👑 Power',
        value: 'Ambition, influence, and the will to rule or control. Represents the desire for authority and dominance.',
        inline: false
      },
      {
        name: '📚 Truth',
        value: 'Pursuit of knowledge, honesty, and understanding. Represents the quest for facts and genuine comprehension.',
        inline: false
      }
    );
  }

  if (type === 'both') {
    embed.setTitle('📖 Dune 2d20 Complete Reference');
    embed.setDescription('Skills and drives used in Dune: Adventures in the Imperium');
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
