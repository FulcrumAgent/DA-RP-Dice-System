import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AutocompleteInteraction,
  ButtonInteraction
} from 'discord.js';
import { COMPLETE_TAROT_DECK, MAJOR_ARCANA, MINOR_ARCANA } from '../data/tarot-cards';
import { TarotCard, TarotSuit } from '../types/tarot-types';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export const duneTarotCommand = new SlashCommandBuilder()
  .setName('tarot')
  .setDescription('Draw and interpret cards from the Dune Tarot deck')
  .addSubcommand(subcommand =>
    subcommand
      .setName('draw')
      .setDescription('Draw cards from the Dune Tarot')
      .addStringOption(option =>
        option
          .setName('spread')
          .setDescription('Type of reading to perform')
          .setRequired(false)
          .addChoices(
            { name: 'Single Card', value: 'single' },
            { name: 'Three Card (Past/Present/Future)', value: 'three-card' },
            { name: 'Five Card (Situation)', value: 'five-card' },
            { name: 'Major Arcana Only', value: 'major-only' }
          )
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('card')
      .setDescription('Look up a specific tarot card')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('Name of the card to look up')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('deck')
      .setDescription('View information about the Dune Tarot deck')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('shuffle')
      .setDescription('Perform a ceremonial shuffle of the deck')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  const correlationId = crypto.randomUUID();

  logger.info('Dune Tarot command executed', {
    userId: interaction.user.id,
    channelId: interaction.channelId,
    subcommand,
    correlationId
  });

  switch (subcommand) {
    case 'draw':
      await handleDraw(interaction, correlationId);
      break;
    case 'card':
      await handleCard(interaction, correlationId);
      break;
    case 'deck':
      await handleDeck(interaction, correlationId);
      break;
    case 'shuffle':
      await handleShuffle(interaction, correlationId);
      break;
  }
}

async function handleDraw(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  const spread = interaction.options.getString('spread') || 'single';
  
  await interaction.deferReply();

  let cards: TarotCard[] = [];
  let deckToUse = COMPLETE_TAROT_DECK;
  
  if (spread === 'major-only') {
    deckToUse = MAJOR_ARCANA;
  }

  // Shuffle and draw cards
  const shuffledDeck = [...deckToUse].sort(() => Math.random() - 0.5);
  
  switch (spread) {
    case 'single':
    case 'major-only':
      cards = [shuffledDeck[0]];
      break;
    case 'three-card':
      cards = shuffledDeck.slice(0, 3);
      break;
    case 'five-card':
      cards = shuffledDeck.slice(0, 5);
      break;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎴 Dune Tarot Reading: ${getSpreadName(spread)}`)
    .setColor(0x8B4513)
    .setFooter({ 
      text: `Reading performed for ${interaction.user.displayName}`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  if (spread === 'single' || spread === 'major-only') {
    const card = cards[0];
    embed.setDescription(`**${card.name}**\n\n*${card.description}*`);
    
    if (card.symbolism) {
      embed.addFields({
        name: '🔮 Symbolism',
        value: card.symbolism,
        inline: false
      });
    }
    
    if (card.roleplayHints && card.roleplayHints.length > 0) {
      embed.addFields({
        name: '🎭 Roleplay Inspiration',
        value: card.roleplayHints.join('\n• '),
        inline: false
      });
    }
  } else {
    // Multi-card spreads
    const positions = getSpreadPositions(spread);
    
    cards.forEach((card, index) => {
      const position = positions[index];
      embed.addFields({
        name: `${position}: ${card.name}`,
        value: card.description,
        inline: spread === 'three-card'
      });
    });
  }

  const actionRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`tarot_draw_again_${spread}`)
        .setLabel('Draw Again')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄'),
      new ButtonBuilder()
        .setCustomId('tarot_interpretation')
        .setLabel('Get Interpretation')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📖')
    );

  await interaction.editReply({ embeds: [embed], components: [actionRow] });
}

async function handleCard(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  const cardName = interaction.options.getString('name', true);
  
  await interaction.deferReply();

  const card = COMPLETE_TAROT_DECK.find(c => 
    c.name.toLowerCase() === cardName.toLowerCase() ||
    c.id.toLowerCase() === cardName.toLowerCase()
  );

  if (!card) {
    await interaction.editReply({ content: 'Card not found. Use `/tarot deck` to see all available cards.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎴 ${card.name}`)
    .setDescription(card.description)
    .setColor(card.isMajorArcana ? 0xDAA520 : getSuitColor(card.suit))
    .setTimestamp();

  if (card.isMajorArcana) {
    embed.addFields({
      name: '✨ Type',
      value: 'Major Arcana',
      inline: true
    });
  } else if (card.suit && card.rank) {
    embed.addFields(
      {
        name: '🃏 Suit',
        value: card.suit,
        inline: true
      },
      {
        name: '🎯 Rank',
        value: card.rank,
        inline: true
      }
    );
  }

  if (card.symbolism) {
    embed.addFields({
      name: '🔮 Symbolism',
      value: card.symbolism,
      inline: false
    });
  }

  if (card.roleplayHints && card.roleplayHints.length > 0) {
    embed.addFields({
      name: '🎭 Roleplay Inspiration',
      value: '• ' + card.roleplayHints.join('\n• '),
      inline: false
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleDeck(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  await interaction.deferReply();

  const majorArcanaCount = MAJOR_ARCANA.length;
  const minorArcanaCount = MINOR_ARCANA.length;
  const totalCards = COMPLETE_TAROT_DECK.length;

  const embed = new EmbedBuilder()
    .setTitle('🎴 The Dune Tarot')
    .setDescription('*"The cards know. The cards see. The cards reveal what is hidden in the deep desert of the mind."*')
    .setColor(0x8B4513)
    .addFields(
      {
        name: '📊 Deck Composition',
        value: `**Total Cards:** ${totalCards}\n**Major Arcana:** ${majorArcanaCount}\n**Minor Arcana:** ${minorArcanaCount}`,
        inline: true
      },
      {
        name: '🃏 Suits',
        value: `• **Knives** - Conflict and precision\n• **Coins** - Wealth and trade\n• **Water** - Life and precious resources\n• **Spice** - Transformation and power`,
        inline: true
      },
      {
        name: '👑 Court Cards',
        value: `• **Lord** - Command and leadership\n• **Lady** - Wisdom and intuition\n• **Heir** - Potential and growth\n• **Regent** - Authority and governance`,
        inline: false
      },
      {
        name: '📜 About the Dune Tarot',
        value: 'The Dune Tarot is an in-world set of tarot cards with an Arrakis theme. Each card is 70mm wide and 120mm tall, traditionally sold in a red and green box. The deck reflects the harsh realities and deep mysticism of the desert planet.',
        inline: false
      },
      {
        name: '🎮 Usage',
        value: 'Use `/tarot draw` for readings, `/tarot card` to look up specific cards, or `/tarot shuffle` for ceremonial purposes.',
        inline: false
      }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleShuffle(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  await interaction.deferReply();

  const shuffleMessages = [
    "The cards whisper secrets of the deep desert...",
    "Shai-Hulud stirs beneath the dunes as the cards dance...",
    "The spice flows through the deck, revealing hidden truths...",
    "Ancient Fremen wisdom guides the shuffle...",
    "The prescient eye sees all possibilities in the cards...",
    "Desert winds carry the cards to their destined positions..."
  ];

  const message = shuffleMessages[Math.floor(Math.random() * shuffleMessages.length)];

  const embed = new EmbedBuilder()
    .setTitle('🌪️ Ceremonial Shuffle')
    .setDescription(`*${message}*\n\nThe Dune Tarot deck has been ceremonially shuffled. The cards are ready to reveal the mysteries of the desert.`)
    .setColor(0xDAA520)
    .addFields({
      name: '🎴 Deck Status',
      value: `**${COMPLETE_TAROT_DECK.length}** cards shuffled\nReady for readings`,
      inline: true
    })
    .setTimestamp()
    .setFooter({ text: 'May the spice guide your path' });

  const actionRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('tarot_draw_again_single')
        .setLabel('Draw a Card')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎴')
    );

  await interaction.editReply({ embeds: [embed], components: [actionRow] });
}

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedValue = interaction.options.getFocused();
  
  const choices = COMPLETE_TAROT_DECK
    .filter(card => card.name.toLowerCase().includes(focusedValue.toLowerCase()))
    .slice(0, 25)
    .map(card => ({
      name: card.name,
      value: card.name
    }));

  await interaction.respond(choices);
}

function getSpreadName(spread: string): string {
  const names = {
    'single': 'Single Card',
    'three-card': 'Past, Present, Future',
    'five-card': 'Situation Reading',
    'major-only': 'Major Arcana Only'
  };
  return names[spread as keyof typeof names] || 'Unknown Spread';
}

function getSpreadPositions(spread: string): string[] {
  const positions = {
    'three-card': ['Past', 'Present', 'Future'],
    'five-card': ['Situation', 'Challenge', 'Past Influence', 'Possible Future', 'Outcome']
  };
  return positions[spread as keyof typeof positions] || [];
}

function getSuitColor(suit?: TarotSuit): number {
  if (!suit) return 0x8B4513;
  
  const colors = {
    [TarotSuit.KNIVES]: 0xC0C0C0, // Silver
    [TarotSuit.COINS]: 0xFFD700, // Gold
    [TarotSuit.WATER]: 0x4169E1, // Royal Blue
    [TarotSuit.SPICE]: 0xFF8C00  // Dark Orange
  };
  
  return colors[suit];
}

// Button interaction handler for tarot commands
export async function handleTarotButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.customId.startsWith('tarot_')) {
    return;
  }

  try {
    if (interaction.customId.startsWith('tarot_draw_again_')) {
      // Extract the spread type from the button ID
      const spread = interaction.customId.replace('tarot_draw_again_', '') as string;
      
      // Create a mock ChatInputCommandInteraction for the draw function
      const mockInteraction = {
        ...interaction,
        isCommand: () => true,
        isChatInputCommand: () => true,
        options: {
          getSubcommand: () => 'draw',
          getString: (name: string) => name === 'spread' ? spread : null
        },
        reply: interaction.update.bind(interaction)
      } as unknown as ChatInputCommandInteraction;

      await execute(mockInteraction);
    } else if (interaction.customId === 'tarot_interpretation') {
      await interaction.reply({
        content: '🔮 **Dune Tarot Interpretation Guide**\n\n' +
                 '**Major Arcana** represents the great forces of the universe, the deep currents of fate that shape civilizations.\n' +
                 '**Minor Arcana** reflects the daily struggles and choices that define individual paths.\n\n' +
                 '• **Knives (Swords)** - Conflict, power, mental challenges\n' +
                 '• **Coins (Pentacles)** - Resources, trade, material concerns\n' +
                 '• **Water (Cups)** - Emotions, relationships, spiritual matters\n' +
                 '• **Spice (Wands)** - Action, creativity, transformation\n\n' +
                 '*The spice must flow, and so must understanding.*',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error in handleTarotButton:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your tarot request.',
      ephemeral: true
    });
  }
}
