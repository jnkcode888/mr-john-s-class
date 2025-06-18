import { Box, Heading, Text, VStack, useColorModeValue, Icon, Button } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface UnitCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  showViewButton?: boolean;
  onView?: () => void;
}

const UnitCard = ({ title, description, icon, onClick, showViewButton, onView }: UnitCardProps) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box
      p={{ base: 5, md: 6 }}
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="md"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.3s ease"
      position="relative"
      overflow="hidden"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
        bg: hoverBgColor,
        '&::after': {
          transform: 'scaleX(1)',
        },
      }}
      _after={{
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '3px',
        bg: 'linear-gradient(to right, blue.400, teal.500)',
        transform: 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform 0.3s ease',
      }}
    >
      <VStack spacing={4} align="start">
        <Box
          p={3}
          borderRadius="lg"
          bg={useColorModeValue('blue.50', 'blue.900')}
          color={useColorModeValue('blue.500', 'blue.200')}
        >
          <Text fontSize="3xl">{icon}</Text>
        </Box>
        <VStack align="start" spacing={2}>
          <Heading
            size="md"
            color={useColorModeValue('gray.700', 'white')}
            fontSize={{ base: 'lg', md: 'xl' }}
          >
            {title}
          </Heading>
          <Text
            color={textColor}
            fontSize={{ base: 'sm', md: 'md' }}
            noOfLines={2}
          >
            {description}
          </Text>
        </VStack>
        {showViewButton && (
          <Button colorScheme="blue" mt={2} onClick={e => { e.stopPropagation(); onView && onView(); }}>
            View Unit
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default UnitCard; 