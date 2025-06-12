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
  Stack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  HStack,
  IconButton,
  useColorModeValue,
  Badge,
  Radio,
  RadioGroup,
  Flex,
  Spacer,
  Tooltip,
  Divider,
  useColorMode,
  Icon,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon, ViewIcon, DownloadIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import type { Quiz, Question, Submission, Assignment, AssignmentSubmission } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);
const MotionButton = motion(Button);

type QuestionFormData = {
  question_text: string;
  choices: string[];
  correct_choice: number;
};

export default function AdminPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState<string>('');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    question_text: '',
    choices: ['', ''],
    correct_choice: 0,
  });

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const { isOpen: isViewAnswersOpen, onOpen: onViewAnswersOpen, onClose: onViewAnswersClose } = useDisclosure();
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<(AssignmentSubmission & { assignment: Assignment })[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const { colorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [assignmentSubmissionsForModal, setAssignmentSubmissionsForModal] = useState<(AssignmentSubmission & { assignment: Assignment })[]>([]);
  const { isOpen: isSubmissionsModalOpen, onOpen: onSubmissionsModalOpen, onClose: onSubmissionsModalClose } = useDisclosure();

  useEffect(() => {
    fetchQuizzes();
    fetchAssignmentSubmissions();
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      fetchQuestions(selectedQuiz.id);
      fetchSubmissions(selectedQuiz.id);
    }
  }, [selectedQuiz]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error loading quizzes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchQuestions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at');

      if (error) throw error;
      setQuestions(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error loading questions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchSubmissions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error loading submissions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchAssignmentSubmissions = async () => {
    try {
      console.log('Fetching assignment submissions...');
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*, assignment:assignments(*)')
        .order('id', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched submissions:', data);
      setAssignmentSubmissions(data || []);
    } catch (error) {
      console.error('Error loading assignment submissions:', error);
      toast({
        title: 'Error loading submissions',
        description: 'Please try refreshing the page',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('Current assignment submissions:', assignmentSubmissions);
  }, [assignmentSubmissions]);

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
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({ title: newQuizTitle })
        .select()
        .single();

      if (error) throw error;

      setQuizzes(prev => [data, ...prev]);
      setNewQuizTitle('');
      toast({
        title: 'Quiz created successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error creating quiz',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      if (selectedQuiz?.id === quizId) {
        setSelectedQuiz(null);
        setQuestions([]);
      }
      toast({
        title: 'Quiz deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting quiz',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedQuiz) return;
    if (!questionForm.question_text.trim() || questionForm.choices.some(c => !c.trim())) {
      toast({
        title: 'Please fill in all fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          quiz_id: selectedQuiz.id,
          question_text: questionForm.question_text,
          choices: questionForm.choices,
          correct_choice: questionForm.correct_choice,
        })
        .select()
        .single();

      if (error) throw error;

      setQuestions(prev => [...prev, data]);
      setQuestionForm({
        question_text: '',
        choices: ['', ''],
        correct_choice: 0,
      });
      onClose();
      toast({
        title: 'Question added successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error adding question',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast({
        title: 'Question deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting question',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const addChoice = () => {
    setQuestionForm(prev => ({
      ...prev,
      choices: [...prev.choices, ''],
    }));
  };

  const removeChoice = (index: number) => {
    setQuestionForm(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index),
      correct_choice: Math.min(prev.correct_choice, prev.choices.length - 2),
    }));
  };

  const updateChoice = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => (i === index ? value : choice)),
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAnswerText = (questionId: string, answerIndex: number, questions: Question[]) => {
    const question = questions.find(q => q.id === questionId);
    return question?.choices[answerIndex] || 'Unknown';
  };

  // Filtered submissions for search and score
  const filteredSubmissions = questions.length > 0 ? submissions
    .map(sub => {
      const correctAnswers = Object.entries(sub.answers).filter(
        ([questionId, answerIndex]) => {
          const question = questions.find(q => q.id === questionId);
          return question?.correct_choice === answerIndex;
        }
      ).length;
      const score = Math.round((correctAnswers / questions.length) * 100);
      return { ...sub, score };
    })
    .filter(sub => {
      const searchLower = search.toLowerCase();
      const nameMatch = (sub.name || '').toLowerCase().includes(searchLower);
      const admissionMatch = (sub.admission_number || '').toLowerCase().includes(searchLower);
      const scoreMatch = (!minScore || sub.score >= parseInt(minScore)) && 
                        (!maxScore || sub.score <= parseInt(maxScore));
      return (nameMatch || admissionMatch) && scoreMatch;
    })
    .sort((a, b) => {
      // First sort by score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by submission time (ascending)
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    }) : [];

  // Filtered submissions for search and assignment filter
  const filteredAssignmentSubmissions = assignmentSubmissions
    .filter(submission => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        submission.student_name.toLowerCase().includes(searchLower) ||
        submission.admission_number.toLowerCase().includes(searchLower);
      
      const matchesAssignment = !selectedAssignmentFilter || 
        submission.assignment_id === selectedAssignmentFilter;

      return matchesSearch && matchesAssignment;
    });

  // Function to open modal and filter submissions
  const handleViewSubmissions = (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setAssignmentSubmissionsForModal(
      assignmentSubmissions.filter(sub => sub.assignment_id === assignment.id)
    );
    onSubmissionsModalOpen();
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Flex align="center" justify="space-between">
          <Heading
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
            fontSize="4xl"
            fontWeight="extrabold"
          >
            Admin Dashboard
          </Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            variant="solid"
            onClick={() => {/* TODO: Add new assignment modal */}}
          >
            New Assignment
          </Button>
        </Flex>

        <Tabs 
          onChange={(index) => setSelectedTab(index)}
          variant="enclosed"
          colorScheme="blue"
          size="lg"
        >
          <TabList>
            <Tab>Quizzes</Tab>
            <Tab>Assignments</Tab>
            <Tab>Submissions</Tab>
          </TabList>

          <TabPanels>
            {/* Quiz Management Panel */}
            <TabPanel>
              {/* Create New Quiz */}
              <Card>
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="md">Create New Quiz</Heading>
                    <HStack>
                      <Input
                        placeholder="Enter quiz title"
                        value={newQuizTitle}
                        onChange={(e) => setNewQuizTitle(e.target.value)}
                      />
                      <Button
                        colorScheme="blue"
                        onClick={handleCreateQuiz}
                        isLoading={isLoading}
                        isDisabled={!newQuizTitle.trim()}
                      >
                        Create Quiz
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Quiz List */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Quizzes</Heading>
                    {quizzes.map((quiz) => (
                      <Card key={quiz.id} variant="outline">
                        <CardBody>
                          <HStack justify="space-between">
                            <Text
                              cursor="pointer"
                              onClick={() => setSelectedQuiz(quiz)}
                              fontWeight={selectedQuiz?.id === quiz.id ? 'bold' : 'normal'}
                            >
                              {quiz.title}
                            </Text>
                            <IconButton
                              aria-label="Delete quiz"
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                            />
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Selected Quiz Content */}
              {selectedQuiz && (
                <Card>
                  <CardBody>
                    <Tabs onChange={(index) => setSelectedTab(index)}>
                      <TabList>
                        <Tab>Questions</Tab>
                        <Tab>Submissions</Tab>
                        <Tab>Leaderboard</Tab>
                      </TabList>

                      <TabPanels>
                        {/* Questions Panel */}
                        <TabPanel>
                          <VStack spacing={4} align="stretch">
                            <HStack justify="space-between">
                              <Heading size="md">Questions for {selectedQuiz.title}</Heading>
                              <Button
                                leftIcon={<DeleteIcon />}
                                colorScheme="blue"
                                onClick={onOpen}
                              >
                                Add Question
                              </Button>
                            </HStack>

                            {questions.map((question) => (
                              <Card key={question.id} variant="outline">
                                <CardBody>
                                  <VStack align="stretch" spacing={2}>
                                    <Text fontWeight="bold">{question.question_text}</Text>
                                    <RadioGroup value={question.correct_choice.toString()}>
                                      <Stack>
                                        {question.choices.map((choice, index) => (
                                          <Radio key={index} isChecked={index === question.correct_choice}>
                                            {choice}
                                          </Radio>
                                        ))}
                                      </Stack>
                                    </RadioGroup>
                                    <HStack justify="flex-end">
                                      <IconButton
                                        aria-label="Delete question"
                                        icon={<DeleteIcon />}
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => handleDeleteQuestion(question.id)}
                                      />
                                    </HStack>
                                  </VStack>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        </TabPanel>

                        {/* Submissions Panel */}
                        <TabPanel>
                          <VStack spacing={4} align="stretch">
                            <Heading size="md">Submissions for {selectedQuiz.title}</Heading>
                            <HStack spacing={2} mb={2} flexWrap="wrap">
                              <Input
                                placeholder="Search by name or admission number"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                maxW="sm"
                              />
                              <Input
                                placeholder="Min score"
                                type="number"
                                value={minScore}
                                onChange={e => setMinScore(e.target.value)}
                                maxW="100px"
                              />
                              <Input
                                placeholder="Max score"
                                type="number"
                                value={maxScore}
                                onChange={e => setMaxScore(e.target.value)}
                                maxW="100px"
                              />
                              <Text fontWeight="bold" ml="auto">Total: {filteredSubmissions.length}</Text>
                            </HStack>
                            {filteredSubmissions.length === 0 ? (
                              <Text>No submissions found</Text>
                            ) : (
                              <AnimatePresence>
                                {filteredSubmissions.map((submission, idx) => {
                                  const color = submission.score >= 70 ? 'green.100' : submission.score >= 50 ? 'yellow.100' : 'red.100';
                                  return (
                                    <motion.div
                                      key={submission.id}
                                      initial={{ opacity: 0, y: 30 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 30 }}
                                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                                    >
                                      <Card boxShadow="lg" borderRadius="xl" bg={color} mb={2}>
                                        <CardBody>
                                          <HStack justify="space-between" align="flex-start" flexWrap="wrap">
                                            <VStack align="start" spacing={1} flex={1} minW={0}>
                                              <Text fontWeight="bold" fontSize="lg">{submission.name}</Text>
                                              <Text fontSize="sm" color="gray.600">Admission: {submission.admission_number}</Text>
                                              <Text fontSize="sm" color="gray.500">Submitted: {formatDate(submission.submitted_at)}</Text>
                                              <Badge colorScheme={submission.score >= 70 ? 'green' : submission.score >= 50 ? 'yellow' : 'red'} fontSize="md">
                                                {submission.score}%
                                              </Badge>
                                            </VStack>
                                            <Button 
                                              size="sm" 
                                              onClick={() => {
                                                setSelectedSubmission(submission);
                                                onViewAnswersOpen();
                                              }}
                                            >
                                              View Answers
                                            </Button>
                                          </HStack>
                                        </CardBody>
                                      </Card>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            )}
                          </VStack>
                        </TabPanel>

                        {/* View Answers Modal */}
                        <TabPanel>
                          <Modal isOpen={isViewAnswersOpen} onClose={onViewAnswersClose} size="xl">
                            <ModalOverlay />
                            <ModalContent>
                              <ModalHeader>
                                {selectedSubmission?.name}'s Answers
                              </ModalHeader>
                              <ModalCloseButton />
                              <ModalBody>
                                <VStack spacing={4} align="stretch">
                                  {selectedSubmission && questions.map((question) => (
                                    <Card key={question.id} variant="outline">
                                      <CardBody>
                                        <VStack align="stretch" spacing={2}>
                                          <Text fontWeight="bold">
                                            {question.question_text}
                                          </Text>
                                          <Text>
                                            Student's Answer:{' '}
                                            {getAnswerText(
                                              question.id,
                                              selectedSubmission.answers[question.id],
                                              questions
                                            )}
                                          </Text>
                                          <Text>
                                            Correct Answer:{' '}
                                            {question.choices[question.correct_choice]}
                                          </Text>
                                          <Badge
                                            colorScheme={
                                              selectedSubmission.answers[question.id] ===
                                              question.correct_choice
                                                ? 'green'
                                                : 'red'
                                            }
                                          >
                                            {selectedSubmission.answers[question.id] ===
                                            question.correct_choice
                                              ? 'Correct'
                                              : 'Incorrect'}
                                          </Badge>
                                        </VStack>
                                      </CardBody>
                                    </Card>
                                  ))}
                                </VStack>
                              </ModalBody>
                              <ModalFooter>
                                <Button onClick={onViewAnswersClose}>Close</Button>
                              </ModalFooter>
                            </ModalContent>
                          </Modal>
                        </TabPanel>

                        {/* Leaderboard Panel */}
                        <TabPanel>
                          <VStack spacing={4} align="stretch">
                            <Heading size="md">Leaderboard for {selectedQuiz.title}</Heading>
                            <HStack spacing={2} mb={2} flexWrap="wrap">
                              <Input
                                placeholder="Search by name or admission number"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                maxW="sm"
                              />
                              <Input
                                placeholder="Min score"
                                type="number"
                                value={minScore}
                                onChange={e => setMinScore(e.target.value)}
                                maxW="100px"
                              />
                              <Input
                                placeholder="Max score"
                                type="number"
                                value={maxScore}
                                onChange={e => setMaxScore(e.target.value)}
                                maxW="100px"
                              />
                              <Text fontWeight="bold" ml="auto">Total: {filteredSubmissions.length}</Text>
                            </HStack>
                            <AnimatePresence>
                              {filteredSubmissions.map((sub, idx) => {
                                const color = sub.score >= 70 ? 'green.100' : sub.score >= 50 ? 'yellow.100' : 'red.100';
                                return (
                                  <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 30 }}
                                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                                  >
                                    <Card boxShadow="lg" borderRadius="xl" bg={color} mb={2}>
                                      <CardBody>
                                        <HStack justify="space-between" align="flex-start" flexWrap="wrap">
                                          <VStack align="start" spacing={1} flex={1} minW={0}>
                                            <Text fontWeight="bold" fontSize="lg">{sub.name}</Text>
                                            <Text fontSize="sm" color="gray.600">Admission: {sub.admission_number}</Text>
                                            <Text fontSize="sm" color="gray.500">Submitted: {formatDate(sub.submitted_at)}</Text>
                                            <Badge colorScheme={sub.score >= 70 ? 'green' : sub.score >= 50 ? 'yellow' : 'red'} fontSize="md">
                                              {sub.score}%
                                            </Badge>
                                          </VStack>
                                          <Text fontWeight="bold" fontSize="2xl" color="blue.600" minW="60px" textAlign="right">
                                            #{idx + 1}
                                          </Text>
                                        </HStack>
                                      </CardBody>
                                    </Card>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </VStack>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </CardBody>
                </Card>
              )}
            </TabPanel>

            {/* Assignments Panel */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="lg">Assignments</Heading>
                  <HStack>
                    <Input
                      placeholder="Search assignments..."
                      maxW="300px"
                      size="md"
                    />
                    <Select placeholder="Sort by" maxW="200px">
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="title">Title</option>
                    </Select>
                  </HStack>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {assignments.map((assignment) => (
                    <MotionCard
                      key={assignment.id}
                      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      variant="outline"
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Heading size="md">{assignment.title}</Heading>
                          <Text color="gray.500">{assignment.description}</Text>
                          <Text fontSize="sm" color="gray.400">Created: {formatDate(assignment.created_at)}</Text>
                          <Button
                            colorScheme="blue"
                            leftIcon={<ViewIcon />}
                            onClick={() => handleViewSubmissions(assignment)}
                            mt={2}
                          >
                            View Submissions
                          </Button>
                        </VStack>
                      </CardBody>
                    </MotionCard>
                  ))}
                </SimpleGrid>

                {assignments.length === 0 && (
                  <Card variant="outline">
                    <CardBody>
                      <VStack spacing={4}>
                        <Icon as={AddIcon} w={10} h={10} color="gray.400" />
                        <Text textAlign="center" color="gray.500">
                          No assignments yet. Create your first assignment!
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Submissions Panel */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="lg">Assignment Submissions</Heading>
                  <HStack>
                    <Input
                      placeholder="Search by student name or admission number..."
                      maxW="300px"
                      size="md"
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Select 
                      placeholder="Filter by assignment" 
                      maxW="200px"
                      value={selectedAssignmentFilter}
                      onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
                    >
                      {assignments.map(assignment => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {assignmentSubmissions.map((submission) => (
                    <Card key={submission.id} variant="outline">
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <Flex justify="space-between" align="center">
                            <Heading size="md">{submission.assignment?.title || 'Unknown Assignment'}</Heading>
                            <Badge colorScheme="green">Submitted</Badge>
                          </Flex>
                          
                          <VStack align="stretch" spacing={2}>
                            <HStack>
                              <Text fontWeight="bold">Student:</Text>
                              <Text>{submission.student_name}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="bold">Admission:</Text>
                              <Text>{submission.admission_number}</Text>
                            </HStack>
                            <HStack>
                              <Text fontWeight="bold">Submitted:</Text>
                              <Text>{formatDate(submission.created_at)}</Text>
                            </HStack>
                          </VStack>

                          <Divider />

                          <HStack justify="space-between">
                            <Button
                              as="a"
                              href={submission.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              colorScheme="blue"
                              size="sm"
                              leftIcon={<ViewIcon />}
                            >
                              View Submission
                            </Button>
                            <Button
                              colorScheme="green"
                              size="sm"
                              leftIcon={<StarIcon />}
                            >
                              Grade
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {assignmentSubmissions.length === 0 && (
                  <Card variant="outline">
                    <CardBody>
                      <VStack spacing={4}>
                        <Icon as={ViewIcon} w={10} h={10} color="gray.400" />
                        <Text textAlign="center" color="gray.500">
                          No assignment submissions yet
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Add Question Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add New Question</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Question Text</FormLabel>
                  <Input
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                    placeholder="Enter your question"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Choices</FormLabel>
                  <VStack spacing={2}>
                    {questionForm.choices.map((choice, index) => (
                      <HStack key={index}>
                        <Input
                          value={choice}
                          onChange={(e) => updateChoice(index, e.target.value)}
                          placeholder={`Choice ${index + 1}`}
                        />
                        {questionForm.choices.length > 2 && (
                          <IconButton
                            aria-label="Remove choice"
                            icon={<DeleteIcon />}
                            onClick={() => removeChoice(index)}
                            colorScheme="red"
                            variant="ghost"
                          />
                        )}
                      </HStack>
                    ))}
                    <Button
                      leftIcon={<DeleteIcon />}
                      onClick={addChoice}
                      size="sm"
                      variant="outline"
                    >
                      Add Choice
                    </Button>
                  </VStack>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Correct Answer</FormLabel>
                  <RadioGroup
                    value={questionForm.correct_choice.toString()}
                    onChange={(value) => setQuestionForm(prev => ({ ...prev, correct_choice: parseInt(value) }))}
                  >
                    <Stack>
                      {questionForm.choices.map((choice, index) => (
                        <Radio key={index} value={index.toString()}>
                          {choice || `Choice ${index + 1}`}
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleAddQuestion}>
                Add Question
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Animated Modal for Assignment Submissions */}
        <Modal isOpen={isSubmissionsModalOpen} onClose={onSubmissionsModalClose} size="3xl" motionPreset="slideInBottom">
          <ModalOverlay />
          <ModalContent as={motion.div} initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}>
            <ModalHeader>
              Submissions for: {viewingAssignment?.title}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {assignmentSubmissionsForModal.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {assignmentSubmissionsForModal.map((submission) => (
                    <MotionCard
                      key={submission.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      variant="outline"
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          <HStack>
                            <Text fontWeight="bold">Student:</Text>
                            <Text>{submission.student_name}</Text>
                          </HStack>
                          <HStack>
                            <Text fontWeight="bold">Admission:</Text>
                            <Text>{submission.admission_number}</Text>
                          </HStack>
                          <HStack>
                            <Text fontWeight="bold">Submitted:</Text>
                            <Text>{formatDate(submission.created_at)}</Text>
                          </HStack>
                          <Button
                            as="a"
                            href={submission.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="blue"
                            size="sm"
                            leftIcon={<ViewIcon />}
                          >
                            View Document
                          </Button>
                        </VStack>
                      </CardBody>
                    </MotionCard>
                  ))}
                </SimpleGrid>
              ) : (
                <VStack spacing={4} py={8}>
                  <Icon as={ViewIcon} w={10} h={10} color="gray.400" />
                  <Text color="gray.500">No submissions for this assignment yet.</Text>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onSubmissionsModalClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
} 