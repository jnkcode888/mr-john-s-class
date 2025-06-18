import { Box, SimpleGrid, Heading, Container, Button, VStack, Text, useColorModeValue, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { DownloadIcon, ViewIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';

const MotionBox = motion(Box);

interface Topic {
  id: number;
  unit_id: number;
  title: string;
  description: string;
}

interface TopicNote {
  id: number;
  topic_id: number;
  title: string;
  content: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

const TopicsPage = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'white');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicNotes, setTopicNotes] = useState<{ [topicId: number]: TopicNote | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<TopicNote | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchTopicsAndNotes();
    // eslint-disable-next-line
  }, [unitId]);

  const fetchTopicsAndNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch topics for this unit
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .eq('unit_id', unitId)
        .order('id');
      if (topicsError) throw topicsError;
      setTopics(topicsData || []);

      // Fetch notes for all topics in this unit
      const topicIds = (topicsData || []).map((t: Topic) => t.id);
      if (topicIds.length > 0) {
        const { data: notesData, error: notesError } = await supabase
          .from('topic_notes')
          .select('*')
          .in('topic_id', topicIds);
        if (notesError) throw notesError;
        // Map topicId to note
        const notesMap: { [topicId: number]: TopicNote | null } = {};
        topicIds.forEach(id => {
          notesMap[id] = (notesData || []).find((n: TopicNote) => n.topic_id === id) || null;
        });
        setTopicNotes(notesMap);
      } else {
        setTopicNotes({});
      }
    } catch (err) {
      setError('Failed to load topics or notes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (note: TopicNote | null) => {
    setSelectedNote(note);
    onOpen();
  };

  const handleDownload = async (note: TopicNote | null, topic: Topic) => {
    if (!note) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    const marginLeft = 40;
    const marginTop = 40;
    const fileName = `${topic.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

    // Create a container for the HTML
    const htmlContent = `
      <div>
        <h2>${topic.title}: ${note.title}</h2>
        <div>${note.content}</div>
        ${note.file_url ? `<div><em>Attached File: <a href='${note.file_url}'>${note.file_url}</a></em></div>` : ''}
        <div style='font-size:10pt;margin-top:16pt;'>Created: ${new Date(note.created_at).toLocaleDateString()}<br/>Last Updated: ${new Date(note.updated_at).toLocaleDateString()}</div>
      </div>
    `;

    // Use jsPDF's html method to render HTML (including tables)
    await doc.html(htmlContent, {
      x: marginLeft,
      y: marginTop,
      width: 520, // fit to A4
      windowWidth: 800,
      autoPaging: 'text',
      html2canvas: { scale: 0.7 },
      callback: function (doc) {
        doc.save(fileName);
      }
    });
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} py={{ base: 8, md: 12 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="center" justify="center" minH="60vh">
            <Spinner size="xl" color="blue.500" />
            <Text>Loading topics...</Text>
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
          <VStack spacing={4} align="stretch">
            <Button
              leftIcon={<ChevronLeftIcon />}
              variant="ghost"
              onClick={() => navigate('/units')}
              alignSelf="flex-start"
              size="sm"
            >
              Back to Units
            </Button>
            <VStack spacing={2} textAlign="center">
              <Heading
                as="h1"
                fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
                fontWeight="bold"
                bgGradient="linear(to-r, blue.400, teal.500)"
                bgClip="text"
              >
                Unit {unitId} Topics
              </Heading>
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                color={textColor}
                maxW="2xl"
              >
                Select a topic to view or download study materials
              </Text>
            </VStack>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={{ base: 6, md: 8 }}
            px={{ base: 4, md: 0 }}
          >
            {topics.map((topic) => {
              const note = topicNotes[topic.id];
              return (
                <MotionBox
                  key={topic.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box
                    p={{ base: 5, md: 6 }}
                    bg={cardBgColor}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    boxShadow="md"
                    position="relative"
                    overflow="hidden"
                    _hover={{
                      boxShadow: 'lg',
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
                    <VStack align="start" spacing={2}>
                      <Heading
                        size="md"
                        color={headingColor}
                        fontSize={{ base: 'lg', md: 'xl' }}
                      >
                        {topic.title}
                      </Heading>
                      <Text
                        color={textColor}
                        fontSize={{ base: 'sm', md: 'md' }}
                        noOfLines={2}
                      >
                        {topic.description}
                      </Text>
                    </VStack>
                    <HStack spacing={4} w="100%" mt={4}>
                      <Button
                        leftIcon={<ViewIcon />}
                        colorScheme="blue"
                        variant="outline"
                        size={{ base: 'sm', md: 'md' }}
                        onClick={() => handleView(note)}
                        flex={1}
                        isDisabled={!note}
                      >
                        View Notes
                      </Button>
                      <Button
                        leftIcon={<DownloadIcon />}
                        colorScheme="green"
                        variant="outline"
                        size={{ base: 'sm', md: 'md' }}
                        onClick={() => handleDownload(note, topic)}
                        flex={1}
                        isDisabled={!note}
                      >
                        Download
                      </Button>
                    </HStack>
                  </Box>
                </MotionBox>
              );
            })}
          </SimpleGrid>
        </VStack>
      </Container>

      {/* Modal for viewing notes */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedNote?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedNote && (
              <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: selectedNote.content }} />
            )}
            {selectedNote?.file_url && (
              <Button as="a" href={selectedNote.file_url} target="_blank" colorScheme="blue" mt={4}>
                View Attached File
              </Button>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TopicsPage; 