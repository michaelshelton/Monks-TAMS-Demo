import React, { useState } from 'react';
import { 
  Container, 
  Title, 
  TextInput, 
  Stack, 
  Card, 
  Text, 
  Badge, 
  Group, 
  Box, 
  Button, 
  Grid,
  Select,
  Alert,
  rem
} from '@mantine/core';
import { 
  IconSearch, 
  IconUser, 
  IconClock, 
  IconTag, 
  IconFilter,
  IconInfoCircle,
  IconArrowRight,
  IconVideo
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { BBCApiOptions } from '../services/api';

// Football search interface
interface FootballSearch extends BBCApiOptions {
  query: string;
  playerNumber?: string;
  playerName?: string;
  team?: string;
  gameDate?: string;
  eventType?: string;
  timerange?: string;
}

// Mock football games for discovery
const mockFootballGames = [
  {
    id: 'game-001',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    date: '2024-01-15',
    venue: 'Old Trafford',
    score: '2-1',
    duration: '90:0',
    highlights: ['Player 19 Goal', 'Player 19 Assist', 'Player 19 Free Kick'],
    tags: {
      'sport': 'football',
      'league': 'Premier League',
      'venue': 'Old Trafford',
      'season': '2024'
    }
  },
  {
    id: 'game-002',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    date: '2024-01-20',
    venue: 'Emirates Stadium',
    score: '1-1',
    duration: '90:0',
    highlights: ['Player 10 Goal', 'Player 22 Save'],
    tags: {
      'sport': 'football',
      'league': 'Premier League',
      'venue': 'Emirates Stadium',
      'season': '2024'
    }
  },
  {
    id: 'game-003',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    date: '2024-01-25',
    venue: 'Camp Nou',
    score: '3-2',
    duration: '90:0',
    highlights: ['Player 9 Hat-trick', 'Player 7 Goal'],
    tags: {
      'sport': 'football',
      'league': 'La Liga',
      'venue': 'Camp Nou',
      'season': '2024'
    }
  }
];

export default function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [team, setTeam] = useState('');
  const [eventType, setEventType] = useState<string | null>('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Event types for football
  const eventTypes = [
    { value: 'goal', label: 'Goal' },
    { value: 'assist', label: 'Assist' },
    { value: 'save', label: 'Save' },
    { value: 'tackle', label: 'Tackle' },
    { value: 'free_kick', label: 'Free Kick' },
    { value: 'penalty', label: 'Penalty' },
    { value: 'yellow_card', label: 'Yellow Card' },
    { value: 'red_card', label: 'Red Card' }
  ];

  // Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Build search parameters
    const searchParams = new URLSearchParams();
    searchParams.append('query', searchQuery);
    if (playerNumber) searchParams.append('playerNumber', playerNumber);
    if (playerName) searchParams.append('playerName', playerName);
    if (team) searchParams.append('team', team);
    if (eventType) searchParams.append('eventType', eventType);
    if (selectedGame) searchParams.append('gameId', selectedGame);

    // Navigate to search results with parameters
    navigate(`/search-results?${searchParams.toString()}`);
  };

  // Handle quick search examples
  const handleQuickSearch = (example: string) => {
    setSearchQuery(example);
    setPlayerNumber('19');
    setPlayerName('Marcus Rashford');
    setTeam('Manchester United');
    setEventType('goal');
    setSelectedGame('game-001');
  };

  // Check if search is ready
  const isSearchReady = searchQuery.trim().length > 0;

  return (
    <Container size="xl" px="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Box ta="center">
          <Title order={1} mb="md" style={{ color: '#333333', fontSize: rem(48), fontWeight: 700 }}>
            Football Content Discovery
          </Title>
          <Text size="lg" c="dimmed" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Search through football games to find specific moments, players, and events using BBC TAMS v6.0 API
          </Text>
        </Box>

        {/* Main Search Interface */}
        <Card withBorder p="xl" radius="lg" shadow="sm">
          <Stack gap="lg">
            <Box ta="center">
              <Title order={3} mb="xs">Find Football Moments</Title>
              <Text c="dimmed">Search for specific players, events, or time ranges</Text>
            </Box>

            {/* Search Input */}
            <TextInput
              size="lg"
              placeholder="e.g., Show me all times when player number 19 was visible"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={20} />}
              rightSection={
                <Button
                  variant="filled"
                  size="sm"
                  onClick={handleSearch}
                  disabled={!isSearchReady}
                  rightSection={<IconArrowRight size={16} />}
                >
                  Search
                </Button>
              }
            />

            {/* Advanced Search Options */}
            <Grid gutter="md">
              <Grid.Col span={3}>
                <TextInput
                  label="Player Number"
                  placeholder="e.g., 19"
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(e.target.value)}
                  leftSection={<IconUser size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Player Name"
                  placeholder="e.g., Marcus Rashford"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  leftSection={<IconUser size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Team"
                  placeholder="e.g., Manchester United"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  leftSection={<IconTag size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Event Type"
                  placeholder="Select event"
                  data={eventTypes}
                  value={eventType}
                  onChange={setEventType}
                  leftSection={<IconFilter size={16} />}
                  clearable
                />
              </Grid.Col>
            </Grid>

            {/* Quick Search Examples */}
            <Box>
              <Text fw={500} mb="xs">Quick Search Examples</Text>
              <Group gap="xs">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handleQuickSearch('Show me all times when player number 19 was visible')}
                >
                  Player 19 Highlights
                </Button>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handleQuickSearch('Find all goals scored by Marcus Rashford')}
                >
                  Rashford Goals
                </Button>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handleQuickSearch('Show Manchester United goals from January 2024')}
                >
                  Man U Goals
                </Button>
              </Group>
            </Box>
          </Stack>
        </Card>

        {/* Available Games */}
        <Card withBorder p="xl" radius="lg" shadow="sm">
          <Stack gap="lg">
            <Box>
              <Title order={3} mb="xs">Available Football Games</Title>
              <Text c="dimmed">Select a specific game to search within, or search across all games</Text>
            </Box>

            <Grid gutter="md">
              {mockFootballGames.map((game) => (
                <Grid.Col key={game.id} span={4}>
                  <Card 
                    withBorder 
                    p="md" 
                    radius="md"
                    style={{ 
                      cursor: 'pointer',
                      borderColor: selectedGame === game.id ? '#228be6' : undefined,
                      borderWidth: selectedGame === game.id ? '2px' : '1px'
                    }}
                    onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="center">
                        <Badge variant="filled" color="blue" size="sm">
                          {game.homeTeam} vs {game.awayTeam}
                        </Badge>
                        {game.score && (
                          <Badge variant="light" color="green" size="sm">
                            {game.score}
                          </Badge>
                        )}
                      </Group>
                      
                      <Text size="sm" c="dimmed">
                        {game.date} • {game.venue}
                      </Text>
                      
                      <Text size="xs" c="dimmed">
                        Duration: {game.duration} • {game.highlights.length} highlights
                      </Text>
                      
                      <Group gap="xs" wrap="wrap">
                        {Object.entries(game.tags).map(([key, value]) => (
                          <Badge key={key} variant="light" color="gray" size="xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Card>

        {/* BBC TAMS Information */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Stack gap="xs">
            <Text fw={500}>BBC TAMS v6.0 Search Capabilities</Text>
            <Text size="sm">
              This search interface demonstrates BBC TAMS advanced filtering capabilities including:
            </Text>
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="blue">Tag-based filtering</Badge>
              <Badge variant="light" color="blue">Temporal queries</Badge>
              <Badge variant="light" color="blue">Player identification</Badge>
              <Badge variant="light" color="blue">Event classification</Badge>
              <Badge variant="light" color="blue">Cross-game search</Badge>
            </Group>
          </Stack>
        </Alert>

        {/* Search Flow Explanation */}
        <Card withBorder p="lg" radius="md">
          <Stack gap="md">
            <Title order={4}>How It Works</Title>
            <Grid gutter="md">
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconSearch size={32} color="#228be6" />
                  <Text fw={500} size="sm" mt="xs">1. Search</Text>
                  <Text size="xs" c="dimmed">Enter your query with filters</Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconFilter size={32} color="#228be6" />
                  <Text fw={500} size="sm" mt="xs">2. Filter</Text>
                  <Text size="xs" c="dimmed">BBC TAMS processes your request</Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconVideo size={32} color="#228be6" />
                  <Text fw={500} size="sm" mt="xs">3. Discover</Text>
                  <Text size="xs" c="dimmed">View matching video segments</Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconUser size={32} color="#228be6" />
                  <Text fw={500} size="sm" mt="xs">4. Analyze</Text>
                  <Text size="xs" c="dimmed">Get insights from your search</Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
} 