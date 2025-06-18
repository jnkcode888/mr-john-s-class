import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  useToast,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Assignment, AssignmentSubmission } from '../lib/supabase';

const MotionButton = motion(Button);

export default function AssignmentPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [studentName, setStudentName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast({
        title: 'Error loading assignments',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAssignmentSelect = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    onOpen();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!studentName || !admissionNumber || !file || !selectedAssignment) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields and select a file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${admissionNumber}_${selectedAssignment.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl || '';

      // Save submission details to database
      const { error: dbError } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: selectedAssignment.id,
          student_name: studentName,
          admission_number: admissionNumber,
          document_url: publicUrl,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Assignment Submitted',
        description: 'Your assignment has been submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setStudentName('');
      setAdmissionNumber('');
      setFile(null);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Heading
            textAlign="center"
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="extrabold"
            mb={4}
          >
            Assignment Submission
          </Heading>
          <Text
            textAlign="center"
            color="gray.600"
            fontSize={{ base: 'md', md: 'lg' }}
            mb={8}
          >
            Submit your assignments and track your progress
          </Text>
        </motion.div>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {assignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                cursor="pointer"
                onClick={() => handleAssignmentSelect(assignment)}
                _hover={{ shadow: 'xl' }}
                bg="white"
                borderRadius="xl"
                overflow="hidden"
                position="relative"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="4px"
                  bgGradient="linear(to-r, blue.400, purple.500)"
                />
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Heading size="md" color="gray.700">
                      {assignment.title}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {assignment.description}
                    </Text>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue" variant="subtle">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </Badge>
                    </HStack>
                    <MotionButton
                      colorScheme="blue"
                      size="sm"
                      width="full"
                      mt={2}
                      _hover={{
                        transform: 'translateY(-2px)',
                        shadow: 'md',
                      }}
                    >
                      View Assignment
                    </MotionButton>
                  </VStack>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </SimpleGrid>

        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Submit Assignment</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                <Text fontWeight="bold" fontSize="lg">
                  {selectedAssignment?.title}
                </Text>
                <Text color="gray.600">{selectedAssignment?.description}</Text>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Admission Number</FormLabel>
                  <Input
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    placeholder="Enter your admission number"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Upload Document</FormLabel>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <MotionButton
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                Submit Assignment
              </MotionButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 