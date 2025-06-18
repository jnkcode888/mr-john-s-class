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
import { DeleteIcon, AddIcon, ViewIcon, DownloadIcon, StarIcon, TimeIcon, EditIcon } from '@chakra-ui/icons';
import { supabase } from '../lib/supabase';
import type { Quiz, Question, Submission, Assignment, AssignmentSubmission, UnitNote } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MotionCard = motion(Card);
const MotionButton = motion(Button);

type QuestionFormData = {
  question_text: string;
  choices: string[];
  correct_choice: number;
};

// Add types for Unit, Topic, and TopicNote
interface Unit {
  id: number;
  title: string;
}
interface Topic {
  id: number;
  unit_id: number;
  title: string;
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

  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicNotes, setTopicNotes] = useState<TopicNote[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({
    topic_id: 0,
    title: '',
    content: '',
    file_url: '',
  });

  // Add state for units and topics management
  const [unitForm, setUnitForm] = useState({ title: '', description: '', icon: '' });
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [topicForm, setTopicForm] = useState({ unit_id: '', title: '', description: '' });
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  useEffect(() => {
    fetchQuizzes();
    fetchAssignmentSubmissions();
    fetchAssignments();
    fetchUnits();
    fetchTopicNotes();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      fetchQuestions(selectedQuiz.id);
      fetchSubmissions(selectedQuiz.id);
    }
  }, [selectedQuiz]);

  useEffect(() => {
    if (selectedUnitId) {
      fetchTopics(selectedUnitId);
    } else {
      setTopics([]);
    }
  }, [selectedUnitId]);

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

  const fetchUnits = async () => {
    const { data, error } = await supabase.from('units').select('id, title').order('id');
    if (!error) setUnits(data || []);
  };
  const fetchTopics = async (unitId: number) => {
    const { data, error } = await supabase.from('topics').select('id, unit_id, title').eq('unit_id', unitId).order('id');
    if (!error) setTopics(data || []);
  };
  const fetchTopicNotes = async () => {
    const { data, error } = await supabase.from('topic_notes').select('*').order('created_at', { ascending: false });
    if (!error) setTopicNotes(data || []);
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

  const handleCreateNote = async () => {
    if (!newNote.topic_id || !newNote.title || !newNote.content) return;
    const { data, error } = await supabase.from('topic_notes').insert([newNote]).select();
    if (!error && data) {
      setTopicNotes([data[0], ...topicNotes]);
      setNewNote({ topic_id: 0, title: '', content: '', file_url: '' });
    }
  };
  const handleDeleteNote = async (id: number) => {
    const { error } = await supabase.from('topic_notes').delete().eq('id', id);
    if (!error) setTopicNotes(topicNotes.filter(n => n.id !== id));
  };

  // Add handlers for units
  const handleAddUnit = async () => {
    if (!unitForm.title) return;
    const { data, error } = await supabase.from('units').insert([{ ...unitForm }]).select();
    if (!error && data) {
      setUnits([data[0], ...units]);
      setUnitForm({ title: '', description: '', icon: '' });
    }
  };
  const handleEditUnit = (unit: Unit) => setEditingUnit(unit);
  const handleUpdateUnit = async () => {
    if (!editingUnit) return;
    const { data, error } = await supabase.from('units').update(editingUnit).eq('id', editingUnit.id).select();
    if (!error && data) {
      setUnits(units.map(u => (u.id === editingUnit.id ? data[0] : u)));
      setEditingUnit(null);
    }
  };
  const handleDeleteUnit = async (id: number) => {
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (!error) setUnits(units.filter(u => u.id !== id));
  };

  // Add handlers for topics
  const handleAddTopic = async () => {
    if (!topicForm.unit_id || !topicForm.title) return;
    const { data, error } = await supabase.from('topics').insert([{ ...topicForm, unit_id: Number(topicForm.unit_id) }]).select();
    if (!error && data) {
      setTopics([data[0], ...topics]);
      setTopicForm({ unit_id: '', title: '', description: '' });
    }
  };
  const handleEditTopic = (topic: Topic) => setEditingTopic(topic);
  const handleUpdateTopic = async () => {
    if (!editingTopic) return;
    const { data, error } = await supabase.from('topics').update(editingTopic).eq('id', editingTopic.id).select();
    if (!error && data) {
      setTopics(topics.map(t => (t.id === editingTopic.id ? data[0] : t)));
      setEditingTopic(null);
    }
  };
  const handleDeleteTopic = async (id: number) => {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (!error) setTopics(topics.filter(t => t.id !== id));
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
            <Tab>Units</Tab>
            <Tab>Topics</Tab>
            <Tab>Unit Notes</Tab>
            <Tab>Quizzes</Tab>
            <Tab>Assignments</Tab>
          </TabList>

          <TabPanels>
            {/* Units Management Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Manage Units</Heading>
                <HStack>
                  <Input placeholder="Title" value={unitForm.title} onChange={e => setUnitForm({ ...unitForm, title: e.target.value })} />
                  <Input placeholder="Description" value={unitForm.description} onChange={e => setUnitForm({ ...unitForm, description: e.target.value })} />
                  <Input placeholder="Icon (emoji)" value={unitForm.icon} onChange={e => setUnitForm({ ...unitForm, icon: e.target.value })} />
                  <Button colorScheme="blue" onClick={handleAddUnit}>Add Unit</Button>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {units.map(unit => (
                    <Card key={unit.id}>
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          {editingUnit?.id === unit.id ? (
                            <>
                              <Input value={editingUnit.title} onChange={e => setEditingUnit({ ...editingUnit, title: e.target.value })} />
                              <Input value={editingUnit.description} onChange={e => setEditingUnit({ ...editingUnit, description: e.target.value })} />
                              <Input value={editingUnit.icon} onChange={e => setEditingUnit({ ...editingUnit, icon: e.target.value })} />
                              <Button colorScheme="green" size="sm" onClick={handleUpdateUnit}>Save</Button>
                              <Button size="sm" onClick={() => setEditingUnit(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Heading size="sm">{unit.title} {unit.icon}</Heading>
                              <Text>{unit.description}</Text>
                              <HStack>
                                <Button leftIcon={<EditIcon />} size="sm" onClick={() => handleEditUnit(unit)}>Edit</Button>
                                <Button colorScheme="red" size="sm" onClick={() => handleDeleteUnit(unit.id)}>Delete</Button>
                              </HStack>
                            </>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Topics Management Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Manage Topics</Heading>
                <HStack>
                  <Select placeholder="Select Unit" value={topicForm.unit_id} onChange={e => setTopicForm({ ...topicForm, unit_id: e.target.value })}>
                    {units.map(unit => <option key={unit.id} value={unit.id}>{unit.title}</option>)}
                  </Select>
                  <Input placeholder="Title" value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} />
                  <Input placeholder="Description" value={topicForm.description} onChange={e => setTopicForm({ ...topicForm, description: e.target.value })} />
                  <Button colorScheme="blue" onClick={handleAddTopic}>Add Topic</Button>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {topics.map(topic => (
                    <Card key={topic.id}>
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          {editingTopic?.id === topic.id ? (
                            <>
                              <Select value={editingTopic.unit_id} onChange={e => setEditingTopic({ ...editingTopic, unit_id: Number(e.target.value) })}>
                                {units.map(unit => <option key={unit.id} value={unit.id}>{unit.title}</option>)}
                              </Select>
                              <Input value={editingTopic.title} onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })} />
                              <Input value={editingTopic.description} onChange={e => setEditingTopic({ ...editingTopic, description: e.target.value })} />
                              <Button colorScheme="green" size="sm" onClick={handleUpdateTopic}>Save</Button>
                              <Button size="sm" onClick={() => setEditingTopic(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Heading size="sm">{topic.title}</Heading>
                              <Text>Unit: {units.find(u => u.id === topic.unit_id)?.title || 'N/A'}</Text>
                              <Text>{topic.description}</Text>
                              <HStack>
                                <Button leftIcon={<EditIcon />} size="sm" onClick={() => handleEditTopic(topic)}>Edit</Button>
                                <Button colorScheme="red" size="sm" onClick={() => handleDeleteTopic(topic.id)}>Delete</Button>
                              </HStack>
                            </>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Unit Notes Panel */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Unit Notes</Heading>
                <VStack align="stretch" spacing={4}>
                  <Select placeholder="Select Unit" value={selectedUnitId ?? ''} onChange={e => setSelectedUnitId(Number(e.target.value))}>
                    {units.map(unit => <option key={unit.id} value={unit.id}>{unit.title}</option>)}
                  </Select>
                  <Select placeholder="Select Topic" value={selectedTopicId ?? ''} onChange={e => { setSelectedTopicId(Number(e.target.value)); setNewNote({ ...newNote, topic_id: Number(e.target.value) }); }} isDisabled={!selectedUnitId}>
                    {topics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
                  </Select>
                  <Input placeholder="Note Title" value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} isDisabled={!selectedTopicId} />
                  <ReactQuill
                    value={newNote.content}
                    onChange={value => setNewNote({ ...newNote, content: value })}
                    readOnly={!selectedTopicId}
                    theme="snow"
                    style={{ minHeight: '200px', marginBottom: '16px' }}
                  />
                  <Input placeholder="File URL (optional)" value={newNote.file_url} onChange={e => setNewNote({ ...newNote, file_url: e.target.value })} isDisabled={!selectedTopicId} />
                  <Button colorScheme="blue" onClick={handleCreateNote} isDisabled={!selectedTopicId || !newNote.title || !newNote.content}>Add Note</Button>
                </VStack>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {topicNotes.map(note => {
                    const topic = topics.find(t => t.id === note.topic_id);
                    const unit = units.find(u => u.id === topic?.unit_id);
                    return (
                      <Card key={note.id}>
                        <CardBody>
                          <VStack align="stretch" spacing={2}>
                            <Heading size="sm">{note.title}</Heading>
                            <Text fontSize="sm" color="gray.500">Unit: {unit?.title || 'N/A'} | Topic: {topic?.title || 'N/A'}</Text>
                            <Text noOfLines={3}>{note.content}</Text>
                            <Button colorScheme="red" size="sm" onClick={() => handleDeleteNote(note.id)}>Delete</Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Quiz Panel */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
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
                          <VStack spacing={4} align="stretch">
                              <Heading size="md">Questions for {selectedQuiz.title}</Heading>
                              <Button
                          leftIcon={<AddIcon />}
                                colorScheme="blue"
                                onClick={onOpen}
                              >
                                Add Question
                              </Button>

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
                                        </CardBody>
                                      </Card>
                            )}
                          </VStack>
                        </TabPanel>

            {/* Assignments Panel */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="md">Assignments</Heading>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={() => {
                      setSelectedAssignment(null);
                      onOpen();
                    }}
                  >
                    Add Assignment
                  </Button>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} variant="outline">
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <Heading size="md">{assignment.title}</Heading>
                          <Text noOfLines={3}>{assignment.description}</Text>
                          <HStack justify="space-between">
                            <Badge colorScheme="blue">Created: {formatDate(assignment.created_at)}</Badge>
                            <HStack>
                              <IconButton
                                aria-label="View submissions"
                                icon={<ViewIcon />}
                              size="sm"
                                onClick={() => handleViewSubmissions(assignment)}
                              />
                              <IconButton
                                aria-label="Delete assignment"
                                icon={<DeleteIcon />}
                              size="sm"
                                colorScheme="red"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                              />
                            </HStack>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
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