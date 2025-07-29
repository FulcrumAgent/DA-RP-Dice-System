import { 
  ButtonInteraction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  GuildMember,
  ModalSubmitInteraction
} from 'discord.js';
import { characterCreationState } from '../utils/character-creation-state';

export async function handleStatementsCreate(interaction: ButtonInteraction, member: GuildMember) {
  const state = characterCreationState.getState(member.id, interaction.guild!.id);
  if (!state) {
    await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId('statement_modal')
    .setTitle('Create a Personal Statement');

  const statementInput = new TextInputBuilder()
    .setCustomId('statement_text')
    .setLabel('Your personal statement (max 200 characters)')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(200)
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(statementInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

export async function handleStatementModal(interaction: ModalSubmitInteraction, member: GuildMember) {
  const statement = interaction.fields.getTextInputValue('statement_text');
  
  const state = characterCreationState.getState(member.id, interaction.guild!.id);
  if (!state) {
    await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
    return;
  }

  // Update state with new statement
  const [drive, ...textParts] = statement.split(':');
  const statementText = textParts.join(':').trim();
  
  const updatedStatements = {
    ...(state.data.statements || {}),
    [drive]: statementText
  };
  
  await characterCreationState.updateState(member.id, interaction.guild!.id, {
    data: { ...state.data, statements: updatedStatements },
    lastUpdated: Date.now()
  });

  // Show updated statements
  await showStatementsOverview(interaction, member, updatedStatements);
}

export async function showStatementsOverview(interaction: ModalSubmitInteraction, member: GuildMember, statements: Record<string, string> = {}) {
  const embed = new EmbedBuilder()
    .setTitle('Personal Statements')
    .setDescription('These statements define your character\'s beliefs, goals, or personal mottos')
    .addFields(
      Object.entries(statements).map(([drive, text]) => ({
        name: drive,
        value: text || '*No statement provided*',
        inline: false
      }))
    )
    .setColor(0xD4AF37);

  if (Object.keys(statements).length === 0) {
    embed.setDescription('No statements added yet. Use the button below to add one.');
  }

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('statements_create')
        .setLabel(Object.keys(statements).length > 0 ? 'Add Another Statement' : 'Create Statement')
        .setStyle(1) // Primary
    );

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [embed],
      components: [row],
      content: ''
    });
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
}
