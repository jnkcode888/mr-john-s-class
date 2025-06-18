import { Box, SimpleGrid, Heading, Container, useColorModeValue, Text, VStack, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import UnitCard from '../components/UnitCard';

const MotionBox = motion(Box);

interface Unit {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const UnitsPage = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('id');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      setError('Failed to load units. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} py={{ base: 8, md: 12 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="center" justify="center" minH="60vh">
            <Spinner size="xl" color="blue.500" />
            <Text>Loading units...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bgColor} py={{ base: 8, md: 12 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="center" justify="center" minH="60vh">
            <Text color="red.500">{error}</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={{ base: 8, md: 12 }}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <VStack spacing={4} textAlign="center">
            <Heading
              as="h1"
              fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
              fontWeight="bold"
              bgGradient="linear(to-r, blue.400, teal.500)"
              bgClip="text"
            >
              Course Units
            </Heading>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color={textColor}
              maxW="2xl"
            >
              Select a unit to view its topics and study materials
            </Text>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={{ base: 6, md: 8 }}
            px={{ base: 4, md: 0 }}
          >
            {units.map((unit) => (
              <MotionBox
                key={unit.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <UnitCard
                  title={unit.title}
                  description={unit.description}
                  icon={unit.icon}
                  onClick={() => navigate(`/topics/${unit.id}`)}
                  showViewButton={true}
                  onView={() => navigate(`/topics/${unit.id}`)}
                />
              </MotionBox>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default UnitsPage; 