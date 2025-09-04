import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AutocompleteInteraction,
  ComponentType,
  ButtonInteraction
} from 'discord.js';
import { SysselraadGame, SysselraadPlayer, TarotCard, SYSSELRAAD_CARD_VALUES } from '../types/tarot-types';
import { COMPLETE_TAROT_DECK, MINOR_ARCANA } from '../data/tarot-cards';
import { LANDSRAAD_HOUSES, getCenterHouse, checkSysselraadLine } from '../data/landsraad-houses';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// In-memory game storage (in production, this would be in database)
const activeGames = new Map<string, SysselraadGame>();

export const sysselraadCommand = new SlashCommandBuilder()
  .setName('sysselraad')
  .setDescription('Play the Sysselraad card game inspired by the Landsraad board')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new Sysselraad game')
      .addIntegerOption(option =>
        option
          .setName('players')
          .setDescription('Number of players (2-4)')
          .setRequired(true)
          .addChoices(
            { name: '2 Players', value: 2 },
            { name: '3 Players', value: 3 },
            { name: '4 Players', value: 4 }
          )
      )
      .addStringOption(option =>
        option
          .setName('variant')
          .setDescription('Game variant')
          .setRequired(false)
          .addChoices(
            { name: 'Basic Sysselraad', value: 'basic' },
            { name: 'Speed Sysselraad', value: 'speed' },
            { name: 'Fraufreluches (No Bank Limit)', value: 'faufreluches' },
            { name: 'Street Sysselraad', value: 'street' }
          )
      )
      .addIntegerOption(option =>
        option
          .setName('starting-chips')
          .setDescription('Starting chips per player')
          .setRequired(false)
          .setMinValue(50)
          .setMaxValue(500)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('join')
      .setDescription('Join an existing Sysselraad game')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('View current game status')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('play')
      .setDescription('Play a card to complete a task')
      .addStringOption(option =>
        option
          .setName('card')
          .setDescription('Card to play')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption(option =>
        option
          .setName('house')
          .setDescription('House to target')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('pay')
      .setDescription('Pay the price to reveal a house task')
      .addStringOption(option =>
        option
          .setName('house')
          .setDescription('House to reveal')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('bribe')
      .setDescription('Add chips to a house price')
      .addStringOption(option =>
        option
          .setName('house')
          .setDescription('House to bribe')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addIntegerOption(option =>
        option
          .setName('amount')
          .setDescription('Number of chips to add')
          .setRequired(true)
          .setMinValue(1)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('end-turn')
      .setDescription('End your turn and draw new cards')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('board')
      .setDescription('View the current game board')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('hand')
      .setDescription('View your current hand (private)')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('rules')
      .setDescription('View Sysselraad rules and how to play')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  const correlationId = crypto.randomUUID();

  logger.info('Sysselraad command executed', {
    userId: interaction.user.id,
    channelId: interaction.channelId,
    subcommand,
    correlationId
  });

  switch (subcommand) {
    case 'create':
      await handleCreate(interaction, correlationId);
      break;
    case 'join':
      await handleJoin(interaction, correlationId);
      break;
    case 'status':
      await handleStatus(interaction, correlationId);
      break;
    case 'play':
      await handlePlay(interaction, correlationId);
      break;
    case 'pay':
      await handlePay(interaction, correlationId);
      break;
    case 'bribe':
      await handleBribe(interaction, correlationId);
      break;
    case 'end-turn':
      await handleEndTurn(interaction, correlationId);
      break;
    case 'board':
      await handleBoard(interaction, correlationId);
      break;
    case 'hand':
      await handleHand(interaction, correlationId);
      break;
    case 'rules':
      await handleRules(interaction, correlationId);
      break;
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  const playerCount = interaction.options.getInteger('players', true);
  const variant = interaction.options.getString('variant') || 'basic';
  const startingChips = interaction.options.getInteger('starting-chips') || 100;

  await interaction.deferReply();

  const gameId = interaction.channelId;
  
  if (activeGames.has(gameId)) {
    await interaction.editReply({ content: 'A game is already active in this channel. Use `/sysselraad join` to join or wait for it to finish.' });
    return;
  }

  // Create new game
  const game: SysselraadGame = {
    id: gameId,
    channelId: interaction.channelId,
    players: [{
      userId: interaction.user.id,
      displayName: interaction.user.displayName,
      chips: startingChips,
      hand: [],
      votesEarned: [],
      position: 0
    }],
    gameState: {
      phase: 'setup',
      lastAction: {
        playerId: interaction.user.id,
        action: 'created game',
        timestamp: new Date().toISOString()
      }
    },
    board: {
      houses: LANDSRAAD_HOUSES.map(house => ({
        id: house.id,
        name: house.name,
        houseCard: COMPLETE_TAROT_DECK.find(card => card.id === house.cardAssociation)!,
        taskRevealed: false,
        chips: house.isCenter ? 1 : 0, // Center house starts with chips
        position: house.position,
        voteClaimed: false
      })),
      centerHouseId: getCenterHouse().id
    },
    currentTurn: 0,
    gameRules: {
      variant: variant as any,
      playerCount,
      startingChips,
      housesToCover: getHousesToCover(playerCount),
      minimumBribe: variant === 'basic' ? undefined : 5
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'waiting'
  };

  activeGames.set(gameId, game);

  const embed = new EmbedBuilder()
    .setTitle('🎴 New Sysselraad Game Created')
    .setDescription(`**${variant.charAt(0).toUpperCase() + variant.slice(1)} Sysselraad** game created by ${interaction.user.displayName}`)
    .setColor(0x8B4513)
    .addFields(
      {
        name: '🎯 Game Settings',
        value: `**Players:** ${playerCount}\n**Starting Chips:** ${startingChips}\n**Houses to Cover:** ${game.gameRules.housesToCover}`,
        inline: true
      },
      {
        name: '👥 Players',
        value: `1. ${interaction.user.displayName} *(Creator)*`,
        inline: true
      },
      {
        name: '📋 Status',
        value: `Waiting for ${playerCount - 1} more players to join`,
        inline: false
      }
    )
    .setTimestamp();

  const actionRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('sysselraad_join')
        .setLabel('Join Game')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎮'),
      new ButtonBuilder()
        .setCustomId('sysselraad_rules')
        .setLabel('Rules')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📖')
    );

  await interaction.editReply({ embeds: [embed], components: [actionRow] });
}

async function handleJoin(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  const gameId = interaction.channelId;
  const game = activeGames.get(gameId);

  await interaction.deferReply({ ephemeral: true });

  if (!game) {
    await interaction.editReply({ content: 'No active game in this channel. Use `/sysselraad create` to start a new game.' });
    return;
  }

  if (game.status !== 'waiting') {
    await interaction.editReply({ content: 'This game has already started and cannot accept new players.' });
    return;
  }

  if (game.players.some(p => p.userId === interaction.user.id)) {
    await interaction.editReply({ content: 'You are already in this game!' });
    return;
  }

  if (game.players.length >= game.gameRules.playerCount) {
    await interaction.editReply({ content: 'This game is already full.' });
    return;
  }

  // Add player to game
  game.players.push({
    userId: interaction.user.id,
    displayName: interaction.user.displayName,
    chips: game.gameRules.startingChips,
    hand: [],
    votesEarned: [],
    position: game.players.length
  });

  game.updatedAt = new Date().toISOString();

  await interaction.editReply({ content: 'Successfully joined the Sysselraad game!' });

  // If game is now full, start it
  if (game.players.length === game.gameRules.playerCount) {
    await startGame(game, interaction);
  }
}

async function handleRules(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('🎴 Sysselraad Rules')
    .setDescription('*A card game inspired by Dune: Awakening\'s Landsraad board*')
    .setColor(0x8B4513)
    .addFields(
      {
        name: '🎯 Objective',
        value: 'Earn the most House Votes by completing Tasks, or create a **Sysselraad** (5 houses in a line) to win immediately.',
        inline: false
      },
      {
        name: '🎮 Your Turn',
        value: '1. **Pay a Price** - Spend chips to reveal a House Task\n2. **Complete a Task** - Play a card matching/beating the Task\n3. **Bribe** - Add chips to make a House more expensive\n4. **End Turn** - Discard and draw back to 5 cards',
        inline: false
      },
      {
        name: '🃏 Card Values (Highest to Lowest)',
        value: 'Lord → Lady → Heir → Regent → 10 → 9 → 8 → 7 → 6 → 5 → 4 → 3 → 2 → Ace',
        inline: false
      },
      {
        name: '🏆 Winning',
        value: '• **Vote Majority:** Most votes when all tasks are completed\n• **Sysselraad:** 5 houses in a line (horizontal/vertical/diagonal)\n• **Landsraad Locked:** Tie splits the winnings',
        inline: false
      },
      {
        name: '💰 Chip Management',
        value: 'Houses require payment to reveal their Tasks. Center house costs equal to player count, others cost 1 chip plus any bribes.',
        inline: false
      }
    )
    .setFooter({ text: 'Use /sysselraad create to start a new game' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function startGame(game: SysselraadGame, interaction: ChatInputCommandInteraction): Promise<void> {
  // Set up the game board with tasks and deal hands
  const taskDeck = [...MINOR_ARCANA].sort(() => Math.random() - 0.5);
  const playDeck = [...MINOR_ARCANA].sort(() => Math.random() - 0.5);
  
  // Assign task cards to houses (face down)
  game.board.houses.forEach((house, index) => {
    if (index < taskDeck.length) {
      house.taskCard = taskDeck[index];
    }
  });

  // Deal 5 cards to each player
  let deckIndex = 0;
  game.players.forEach(player => {
    player.hand = playDeck.slice(deckIndex, deckIndex + 5);
    deckIndex += 5;
  });

  // Set initial chip placement based on player count
  const centerHouse = game.board.houses.find(h => h.id === game.board.centerHouseId)!;
  centerHouse.chips = game.players.length;

  // Distribute remaining chips evenly
  const housesToFund = game.board.houses.filter(h => h.id !== game.board.centerHouseId);
  const chipsPerHouse = Math.floor((game.gameRules.housesToCover - 1) / housesToFund.length);
  
  housesToFund.slice(0, game.gameRules.housesToCover - 1).forEach(house => {
    house.chips = 1;
  });

  game.status = 'active';
  game.gameState.phase = 'playing';
  game.currentTurn = 0;
  game.updatedAt = new Date().toISOString();

  // Announce game start
  const embed = new EmbedBuilder()
    .setTitle('🎴 Sysselraad Game Started!')
    .setDescription('The Landsraad board is set. Let the political maneuvering begin!')
    .setColor(0xDAA520)
    .addFields(
      {
        name: '🎯 Current Player',
        value: game.players[0].displayName,
        inline: true
      },
      {
        name: '📊 Game Status',
        value: `**Players:** ${game.players.length}\n**Houses Available:** ${game.board.houses.filter(h => h.chips > 0).length}`,
        inline: true
      }
    )
    .setFooter({ text: 'Use /sysselraad hand to view your cards, /sysselraad board to see the current state' })
    .setTimestamp();

  await interaction.followUp({ embeds: [embed] });
}

function getHousesToCover(playerCount: number): number {
  const requirements = {
    2: 13, // Center + 12 others
    3: 9,  // Center + 8 others  
    4: 7   // Center + 6 others
  };
  return requirements[playerCount as keyof typeof requirements] || 13;
}

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);
  const gameId = interaction.channelId;
  const game = activeGames.get(gameId);

  if (!game) {
    await interaction.respond([]);
    return;
  }

  const player = game.players.find(p => p.userId === interaction.user.id);
  if (!player) {
    await interaction.respond([]);
    return;
  }

  if (focusedOption.name === 'card') {
    const choices = player.hand
      .filter(card => card.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
      .slice(0, 25)
      .map(card => ({
        name: `${card.name} (${card.suit})`,
        value: card.id
      }));

    await interaction.respond(choices);
  } else if (focusedOption.name === 'house') {
    const choices = game.board.houses
      .filter(house => house.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
      .slice(0, 25)
      .map(house => ({
        name: `${house.name} (${house.chips} chips)`,
        value: house.id
      }));

    await interaction.respond(choices);
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  const gameId = interaction.channelId;
  const game = activeGames.get(gameId);

  await interaction.deferReply();

  if (!game) {
    await interaction.editReply({ content: 'No active game in this channel.' });
    return;
  }

  const currentPlayer = game.players[game.currentTurn];
  const completedHouses = game.board.houses.filter(h => h.voteClaimed).length;
  const totalHouses = game.board.houses.filter(h => h.chips > 0).length;

  const embed = new EmbedBuilder()
    .setTitle(`🎴 Sysselraad Game Status`)
    .setColor(0x8B4513)
    .addFields(
      {
        name: '🎯 Current Turn',
        value: currentPlayer ? currentPlayer.displayName : 'Game not started',
        inline: true
      },
      {
        name: '🏆 Progress',
        value: `${completedHouses}/${totalHouses} Houses Claimed`,
        inline: true
      },
      {
        name: '👥 Players',
        value: game.players.map((p, i) => `${i + 1}. ${p.displayName} (${p.chips} chips, ${p.votesEarned.length} votes)`).join('\n'),
        inline: false
      }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handlePlay(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply({ content: 'Card playing functionality is not yet implemented. Stay tuned for updates!' });
}

async function handlePay(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply({ content: 'House payment functionality is not yet implemented. Stay tuned for updates!' });
}

async function handleBribe(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply({ content: 'Bribery functionality is not yet implemented. Stay tuned for updates!' });
}

async function handleEndTurn(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply({ content: 'End turn functionality is not yet implemented. Stay tuned for updates!' });
}

async function handleBoard(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  const gameId = interaction.channelId;
  const game = activeGames.get(gameId);

  await interaction.deferReply();

  if (!game) {
    await interaction.editReply({ content: 'No active game in this channel.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🏛️ Landsraad Board')
    .setDescription('Current state of all Great Houses')
    .setColor(0x8B4513)
    .setTimestamp();

  // Group houses by status
  const availableHouses = game.board.houses.filter(h => h.chips > 0 && !h.voteClaimed);
  const claimedHouses = game.board.houses.filter(h => h.voteClaimed);
  const emptyHouses = game.board.houses.filter(h => h.chips === 0 && !h.voteClaimed);

  if (availableHouses.length > 0) {
    embed.addFields({
      name: '🏆 Available Houses',
      value: availableHouses.map(h => `**${h.name}** - ${h.chips} chips${h.taskRevealed ? ' (task revealed)' : ''}`).join('\n'),
      inline: false
    });
  }

  if (claimedHouses.length > 0) {
    embed.addFields({
      name: '✅ Claimed Houses',
      value: claimedHouses.map(h => `**${h.name}** - Completed`).join('\n'),
      inline: false
    });
  }

  if (emptyHouses.length > 0) {
    embed.addFields({
      name: '🚫 Empty Houses',
      value: emptyHouses.map(h => h.name).join(', '),
      inline: false
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleHand(interaction: ChatInputCommandInteraction, correlationId: string): Promise<void> {
  const gameId = interaction.channelId;
  const game = activeGames.get(gameId);

  await interaction.deferReply({ ephemeral: true });

  if (!game) {
    await interaction.editReply({ content: 'No active game in this channel.' });
    return;
  }

  const player = game.players.find(p => p.userId === interaction.user.id);
  if (!player) {
    await interaction.editReply({ content: 'You are not in this game.' });
    return;
  }

  if (player.hand.length === 0) {
    await interaction.editReply({ content: 'Your hand is empty.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🃏 Your Hand')
    .setDescription(`You have ${player.hand.length} cards`)
    .setColor(0x8B4513)
    .addFields({
      name: 'Cards',
      value: player.hand.map((card, i) => `${i + 1}. **${card.name}** (${card.suit || 'Major Arcana'})`).join('\n'),
      inline: false
    })
    .addFields({
      name: '💰 Your Stats',
      value: `**Chips:** ${player.chips}\n**Votes Earned:** ${player.votesEarned.length}`,
      inline: true
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// Button interaction handler for sysselraad commands
export async function handleSysselraadButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.customId.startsWith('sysselraad_')) {
    return;
  }

  try {
    if (interaction.customId === 'sysselraad_join') {
      await interaction.reply({
        content: '🎮 **Join Sysselraad Game**\n\n' +
                 'To join a Sysselraad game, the game creator must invite you using the game management interface.\n' +
                 'Use `/sysselraad create` to start your own game!',
        ephemeral: true
      });
    } else if (interaction.customId === 'sysselraad_rules') {
      await interaction.reply({
        content: '📜 **Sysselraad Rules**\n\n' +
                 '**Objective:** Control the political landscape through strategic card play and negotiation.\n\n' +
                 '**Basic Gameplay:**\n' +
                 '• Each player represents a Great House\n' +
                 '• Use influence cards to gain political advantage\n' +
                 '• Form alliances and break them as needed\n' +
                 '• Accumulate victory points through controlled territories\n\n' +
                 '**Card Types:**\n' +
                 '• **Coins** - Economic influence and trade\n' +
                 '• **Cups** - Diplomatic relations and alliances\n' +
                 '• **Swords** - Military action and conflict\n' +
                 '• **Rods** - Innovation and special abilities\n\n' +
                 '*Politics is the skilled use of blunt instruments.*',
        ephemeral: true
      });
    } else if (interaction.customId.startsWith('sysselraad_')) {
      // Handle other sysselraad-specific buttons
      await interaction.reply({
        content: '⚙️ This Sysselraad feature is still in development. More functionality coming soon!',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error in handleSysselraadButton:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your Sysselraad request.',
      ephemeral: true
    });
  }
}

export { activeGames };
