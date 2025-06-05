import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Radio,
  RadioGroup,
  Button,
  Input,
  useToast,
  Card,
  CardBody,
  Stack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Progress,
  HStack,
  SimpleGrid,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Quiz, Question, Submission } from '../lib/supabase';

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [studentName, setStudentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Submission[]>([]);
  const [current, setCurrent] = useState(0);
  const toast = useToast();
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [started, setStarted] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [showQuizList, setShowQuizList] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToServer, setIsSavingToServer] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showQuizListContent, setShowQuizListContent] = useState(false);

  // Save progress to server
  const saveProgressToServer = async () => {
    if (!selectedQuiz || !admissionNumber) return;

    setIsSavingToServer(true);
    try {
      const { error } = await supabase
        .from('quiz_progress')
        .upsert({
          quiz_id: selectedQuiz.id,
          admission_number: admissionNumber,
          student_name: studentName,
          answers: answers,
          current_question: current,
          last_saved: new Date().toISOString()
        }, {
          onConflict: 'quiz_id,admission_number'
        });

      if (error) throw error;

      setLastSaved(new Date());
      console.log('Progress saved to server, current question:', current);
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSavingToServer(false);
    }
  };

  // Load progress from server
  const loadProgressFromServer = async () => {
    if (!selectedQuiz || !admissionNumber) return;

    try {
      const { data, error } = await supabase
        .from('quiz_progress')
        .select('*')
        .eq('quiz_id', selectedQuiz.id)
        .eq('admission_number', admissionNumber)
        .single();

      if (error) throw error;

      if (data) {
        console.log('Server data loaded:', data);
        return data; // Return the data for further processing
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  };

  // Auto-save and resume logic
  const QUIZ_KEY = selectedQuiz && admissionNumber ? `quiz-progress-${selectedQuiz.id}-${admissionNumber}` : '';

  // Auto-save to both localStorage and server with debounce
  useEffect(() => {
    if (!QUIZ_KEY || isSubmitted || hasSubmitted) return;

    const saveData = {
      studentName,
      admissionNumber,
      answers,
      locked,
      current,
      started,
      lastSaved: new Date().toISOString()
    };

    // Save to localStorage
    setIsSaving(true);
    localStorage.setItem(QUIZ_KEY, JSON.stringify(saveData));
    setLastSaved(new Date());
    console.log('Progress saved to localStorage, current question:', current);
    setTimeout(() => setIsSaving(false), 1000);

    // Debounce server save
    const timeoutId = setTimeout(() => {
    saveProgressToServer();
    }, 2000); // Wait 2 seconds before saving to server

    return () => clearTimeout(timeoutId);
  }, [studentName, admissionNumber, answers, locked, current, started, QUIZ_KEY, isSubmitted, hasSubmitted]);

  // Restore progress on load - only handle initial load, not resume
  useEffect(() => {
    if (QUIZ_KEY && !isSubmitted && !hasSubmitted && !isResuming) {
      const saved = localStorage.getItem(QUIZ_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.answers && Object.keys(parsed.answers).length > 0) {
            setHasSavedProgress(true);
              setStudentName(parsed.studentName || '');
              setAnswers(parsed.answers || {});
              setLocked(parsed.locked || {});
              if (parsed.lastSaved) {
                setLastSaved(new Date(parsed.lastSaved));
              }
          } else {
            setHasSavedProgress(false);
          }
        } catch (error) {
          console.error('Error restoring quiz:', error);
          setHasSavedProgress(false);
        }
      } else {
        setHasSavedProgress(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QUIZ_KEY]);

  // Add effect to handle started state changes
  useEffect(() => {
    if (started && isResuming) {
      console.log('Started state changed, current question:', current);
    }
  }, [started, isResuming, current]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (isSubmitted && selectedQuiz) {
      fetchLeaderboard();
    }
    if (selectedQuiz && admissionNumber) {
      checkAlreadySubmitted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted, selectedQuiz, admissionNumber]);

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
        description: 'Please try again later',
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
        .eq('quiz_id', quizId);
      if (error) throw error;
      setQuestions(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error loading questions',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleQuizSelect = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    await fetchQuestions(quiz.id);
    setShowQuizList(false);
    
    // Check for saved progress in both localStorage and server
    const saved = localStorage.getItem(`quiz-progress-${quiz.id}-${admissionNumber}`);
    let foundSaved = false;
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.answers && Object.keys(parsed.answers).length > 0) {
          setHasSavedProgress(true);
          setStudentName(parsed.studentName || '');
          foundSaved = true;
        }
      } catch (error) {
        console.error('Error checking saved progress:', error);
      }
    }
    
    // Check server for saved progress
    if (!foundSaved && admissionNumber) {
      try {
        const serverData = await loadProgressFromServer();
        if (serverData && serverData.answers && Object.keys(serverData.answers).length > 0) {
          setHasSavedProgress(true);
          setStudentName(serverData.student_name || '');
          foundSaved = true;
        }
      } catch (error) {
        console.error('Error checking server progress:', error);
      }
    }
    
    // Only reset state if NOT resuming and no saved progress found
    if (!foundSaved && !isResuming) {
      setHasSavedProgress(false);
      setHasSubmitted(false);
      setIsSubmitted(false);
      setStarted(false);
      setShowRevision(false);
      setShowLeaderboard(false);
      setAnswers({});
      setLocked({});
      setCurrent(0);
      setLastSaved(null);
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedQuiz) return;
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('quiz_id', selectedQuiz.id);
      if (error) throw error;
      setLeaderboard(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error loading leaderboard',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const checkAlreadySubmitted = async () => {
    if (!selectedQuiz || !admissionNumber) return;
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id')
        .eq('quiz_id', selectedQuiz.id)
        .eq('admission_number', admissionNumber)
        .maybeSingle();
      
      if (error) throw error;
      setHasSubmitted(!!data);
    } catch (error) {
      console.error('Error checking submission:', error);
      setHasSubmitted(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    if (locked[questionId]) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
    setLocked(prev => ({
      ...prev,
      [questionId]: true
    }));
  };

  const handleStart = async () => {
    if (studentName.trim() && admissionNumber.trim()) {
      // Check if already submitted this specific quiz
      await checkAlreadySubmitted();
      if (hasSubmitted) {
        toast({
          title: 'Already Submitted',
          description: 'You have already submitted this quiz. You can review your answers or view the leaderboard.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setIsSubmitted(true);
        return;
      }

      if (hasSavedProgress) {
        if (window.confirm('You have a saved quiz in progress. Start over and erase your previous answers?')) {
          // Clear saved progress and start fresh
          localStorage.removeItem(QUIZ_KEY);
          setAnswers({});
          setLocked({});
          setCurrent(0);
          setStarted(true);
        }
      } else {
        setStarted(true);
      }
    } else {
      toast({
        title: 'Please enter your name and admission number',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      // First try to load from server
      const serverData = await loadProgressFromServer();
      console.log('Server data in handleResume:', serverData);
      
      if (serverData) {
        // If we have server data, use it directly
        console.log('Using server data, current question:', serverData.current_question);
        
        // Set the state in the correct order
        setStarted(true);
        setStudentName(serverData.student_name || '');
        setAnswers(serverData.answers || {});
        setLocked({}); // Reset locked state for resumed quiz
        setCurrent(serverData.current_question);
        setLastSaved(new Date(serverData.last_saved));
        
        // Update localStorage with server data
        const saveData = {
          studentName: serverData.student_name,
          admissionNumber: serverData.admission_number,
          answers: serverData.answers,
          locked: {},
          current: serverData.current_question,
          started: true,
          lastSaved: serverData.last_saved
        };
        localStorage.setItem(QUIZ_KEY, JSON.stringify(saveData));
        
        // Show confirmation toast
        toast({
          title: 'Quiz Resumed',
          description: `Continuing from question ${serverData.current_question + 1}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Fallback to localStorage only if no server data
        const saved = localStorage.getItem(QUIZ_KEY);
        console.log('No server data, falling back to localStorage:', saved);
        
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed) {
              console.log('Using localStorage data, current question:', parsed.current);
              
              setStarted(true);
              setStudentName(parsed.studentName || '');
              setAnswers(parsed.answers || {});
              setLocked(parsed.locked || {});
              setCurrent(parsed.current);
              
              if (parsed.lastSaved) {
                setLastSaved(new Date(parsed.lastSaved));
              }
              
              toast({
                title: 'Quiz Resumed',
                description: `Continuing from question ${parsed.current + 1}`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            }
          } catch (error) {
            console.error('Error resuming quiz:', error);
            toast({
              title: 'Error Resuming Quiz',
              description: 'Could not resume your progress. Starting from the beginning.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      }
    } finally {
    setIsResuming(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuiz) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .insert({
          quiz_id: selectedQuiz.id,
          name: studentName,
          admission_number: admissionNumber,
          answers: answers
        });
      if (error) throw error;
      setIsSubmitted(true);
      toast({
        title: 'Quiz submitted successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error submitting quiz',
        description: 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      studentName.trim() !== '' &&
      questions.length > 0 &&
      Object.keys(answers).length === questions.length
    );
  };

  // Save last submission info after submit
  useEffect(() => {
    if (isSubmitted && selectedQuiz && admissionNumber) {
      localStorage.setItem('last-quiz-admission', JSON.stringify({ quizId: selectedQuiz.id, admissionNumber }));
    }
  }, [isSubmitted, selectedQuiz, admissionNumber]);

  // Fetch last submission for revision
  const fetchLastSubmission = async () => {
    if (!selectedQuiz || !admissionNumber) return;
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('quiz_id', selectedQuiz.id)
        .eq('admission_number', admissionNumber)
        .single();
      setLastSubmission(data);
    } catch {}
  };

  // If student just submitted, go to landing page with revision/leaderboard options
  useEffect(() => {
    if (isSubmitted) {
      setStarted(false);
      setShowRevision(false);
      setShowLeaderboard(false);
    }
  }, [isSubmitted]);

  // If student clicks revise, fetch their submission and show revision view
  const handleShowRevision = async () => {
    await fetchLastSubmission();
    setShowRevision(true);
    setShowLeaderboard(false);
  };

  // If student clicks leaderboard, show leaderboard view
  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
    setShowRevision(false);
  };

  // Revision view
  if (showRevision && lastSubmission) {
    const correctAnswers = Object.entries(lastSubmission.answers).filter(
      ([questionId, answerIndex]) => {
        const question = questions.find(q => q.id === questionId);
        return question?.correct_choice === answerIndex;
      }
    ).length;
    const score = questions.length > 0
      ? Math.round((correctAnswers / questions.length) * 100)
      : 0;

    return (
      <Container maxW="container.md" py={10}>
        <VStack spacing={8} align="stretch">
          <Card>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Heading size="lg">Your Quiz Results</Heading>
                <HStack justify="space-between">
                  <Text>Name: {lastSubmission.name}</Text>
                  <Text>Admission: {lastSubmission.admission_number}</Text>
                  <Badge colorScheme={score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red'} fontSize="lg">
                    Score: {score}%
                  </Badge>
                </HStack>
                <Divider />
                {questions.map((question, index) => {
                  const studentAnswer = lastSubmission.answers[question.id];
                  const isCorrect = studentAnswer === question.correct_choice;
                  return (
                    <Card key={question.id} variant="outline" bg={isCorrect ? 'green.50' : 'red.50'}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Text fontWeight="bold">Question {index + 1}: {question.question_text}</Text>
                          <Text>Your Answer: {question.choices[studentAnswer]}</Text>
                          <Text>Correct Answer: {question.choices[question.correct_choice]}</Text>
                          <Badge colorScheme={isCorrect ? 'green' : 'red'} alignSelf="start">
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
                <Button onClick={() => setShowRevision(false)}>Back</Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }

  // Leaderboard view
  if (showLeaderboard) {
    const sortedLeaderboard = [...leaderboard]
      .map(sub => {
        const correctAnswers = Object.entries(sub.answers).filter(
          ([questionId, answerIndex]) => {
            const question = questions.find(q => q.id === questionId);
            return question?.correct_choice === answerIndex;
          }
        ).length;
        const score = questions.length > 0
          ? Math.round((correctAnswers / questions.length) * 100)
          : 0;
        return { ...sub, score };
      })
      .sort((a, b) => b.score - a.score || new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

    return (
      <Container maxW="container.md" py={10}>
        <VStack spacing={8} align="stretch">
          <Card>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Heading size="lg">Leaderboard</Heading>
                <SimpleGrid columns={1} spacing={4}>
                  {sortedLeaderboard.map((sub, index) => (
                    <Card key={sub.id} variant="outline">
                      <CardBody>
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{sub.name}</Text>
                            <Text fontSize="sm" color="gray.600">Admission: {sub.admission_number}</Text>
                          </VStack>
                          <HStack spacing={4}>
                            <Badge colorScheme={sub.score >= 70 ? 'green' : sub.score >= 50 ? 'yellow' : 'red'} fontSize="md">
                              {sub.score}%
                            </Badge>
                            <Text fontWeight="bold" color="blue.600">#{index + 1}</Text>
                          </HStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
                <Button onClick={() => setShowLeaderboard(false)}>Back</Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }

  // Quiz list view
  if (showQuizList) {
    return (
      <Container maxW="container.lg" py={10}>
        <VStack spacing={8} align="stretch">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
          >
            <Heading 
              textAlign="center" 
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="extrabold"
              mb={4}
            >
              Welcome to Quiz Master!
            </Heading>
            <Text 
              textAlign="center" 
              color="gray.600" 
              fontSize={{ base: 'md', md: 'lg' }}
              mb={8}
            >
              Test your knowledge and climb the leaderboard
            </Text>
          </motion.div>

          {!showQuizListContent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card 
                bg="white" 
                borderRadius="xl" 
                overflow="hidden"
                boxShadow="xl"
                maxW="2xl"
                mx="auto"
              >
                <CardBody>
                  <VStack spacing={8} py={8}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Text 
                        fontSize={{ base: 'lg', md: 'xl' }} 
                        color="gray.600" 
                        textAlign="center"
                        mb={6}
                      >
                        Ready to challenge yourself? Click below to see available quizzes!
                      </Text>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        colorScheme="blue"
                        bgGradient="linear(to-r, blue.400, purple.500)"
                        _hover={{
                          bgGradient: "linear(to-r, blue.500, purple.600)",
                          transform: "translateY(-2px)",
                          boxShadow: "lg"
                        }}
                        _active={{
                          transform: "translateY(0px)"
                        }}
                        px={8}
                        py={6}
                        fontSize="xl"
                        onClick={() => setShowQuizListContent(true)}
                      >
                        View Available Quizzes
                      </Button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} width="100%">
                        {[
                          { icon: '🎯', text: 'Test Your Knowledge' },
                          { icon: '🏆', text: 'Compete with Others' },
                          { icon: '📈', text: 'Track Your Progress' }
                        ].map((item, index) => (
                          <motion.div
                            key={item.text}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                          >
                            <VStack spacing={2}>
                              <Text fontSize="3xl">{item.icon}</Text>
                              <Text 
                                fontSize="sm" 
                                color="gray.600" 
                                textAlign="center"
                                fontWeight="medium"
                              >
                                {item.text}
                              </Text>
                            </VStack>
                          </motion.div>
                        ))}
                      </SimpleGrid>
                    </motion.div>
                  </VStack>
                </CardBody>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VStack spacing={8}>
                <HStack justify="space-between" w="100%">
                  <Heading size="lg" color="gray.700">
                    Available Quizzes
                  </Heading>
                  <Button
                    variant="ghost"
                    leftIcon={<span>←</span>}
                    onClick={() => setShowQuizListContent(false)}
                  >
                    Back
                  </Button>
                </HStack>

                {/* Top Performers Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 80
                  }}
                >
                  <Card 
                    bg="gray.50" 
                    borderRadius="xl" 
                    overflow="hidden"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardBody>
                      <VStack spacing={4}>
                        <HStack justify="space-between" w="100%">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Heading size="md" color="gray.700">
                              Top Performers
                            </Heading>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <Badge colorScheme="purple" fontSize="sm">
                              Live Rankings
                            </Badge>
                          </motion.div>
                        </HStack>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} width="100%">
                          {leaderboard.slice(0, 3).map((sub, index) => (
                            <motion.div
                              key={sub.id}
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ 
                                duration: 0.5,
                                delay: 0.3 + index * 0.15,
                                type: "spring",
                                stiffness: 100
                              }}
                              whileHover={{ 
                                scale: 1.05,
                                rotateY: 5,
                                transition: { duration: 0.2 }
                              }}
                            >
                              <Card 
                                bg={index === 0 ? 'yellow.50' : index === 1 ? 'gray.100' : 'orange.50'}
                                borderWidth={1}
                                borderColor={index === 0 ? 'yellow.400' : index === 1 ? 'gray.300' : 'orange.300'}
                                boxShadow="lg"
                              >
                                <CardBody>
                                  <VStack spacing={2}>
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ 
                                        delay: 0.5 + index * 0.15,
                                        type: "spring",
                                        stiffness: 200
                                      }}
                                    >
                                      <Badge 
                                        colorScheme={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}
                                        fontSize="lg"
                                        p={2}
                                        borderRadius="full"
                                      >
                                        #{index + 1}
                                      </Badge>
                                    </motion.div>
                                    <Text fontWeight="bold">{sub.name}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                      Score: {Math.round((Object.entries(sub.answers).filter(
                                        ([questionId, answerIndex]) => {
                                          const question = questions.find(q => q.id === questionId);
                                          return question?.correct_choice === answerIndex;
                                        }
                                      ).length / questions.length) * 100)}%
                                    </Text>
                                  </VStack>
                                </CardBody>
                              </Card>
                            </motion.div>
                          ))}
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>
                </motion.div>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {quizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: 1.03,
                        rotateY: 5,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        rotateY: -5,
                        transition: { duration: 0.1 }
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          cursor="pointer"
                          onClick={() => handleQuizSelect(quiz)}
                          _hover={{ shadow: 'xl' }}
                          transition="all 0.3s"
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
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                              >
                                <Heading size="md" color="gray.700">
                                  {quiz.title}
                                </Heading>
                              </motion.div>
                              <HStack spacing={2} color="gray.500">
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.3 + index * 0.1 }}
                                >
                                  <Badge colorScheme="blue" variant="subtle">
                                    {new Date(quiz.created_at).toLocaleDateString()}
                                  </Badge>
                                </motion.div>
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.4 + index * 0.1 }}
                                >
                                  <Badge colorScheme="green" variant="subtle">
                                    New
                                  </Badge>
                                </motion.div>
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.5 + index * 0.1 }}
                                >
                                  <Badge colorScheme="purple" variant="subtle">
                                    {questions.length} Questions
                                  </Badge>
                                </motion.div>
                              </HStack>
                              <Text color="gray.600" fontSize="sm">
                                Challenge yourself with this quiz and test your knowledge!
                              </Text>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{ width: '100%' }}
                              >
                                <Button
                                  colorScheme="blue"
                                  size="sm"
                                  width="full"
                                  mt={2}
                                  _hover={{
                                    transform: 'translateY(-2px)',
                                    shadow: 'md'
                                  }}
                                  transition="all 0.2s"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuizSelect(quiz);
                                  }}
                                >
                                  Start Quiz
                                </Button>
                              </motion.div>
                            </VStack>
                          </CardBody>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ))}
                </SimpleGrid>
              </VStack>
            </motion.div>
          )}
        </VStack>
      </Container>
    );
  }

  // Post-submission view
  if (isSubmitted) {
    return (
      <Container maxW="container.sm" py={10}>
        <VStack spacing={8} align="stretch">
          <Card boxShadow="2xl" borderRadius="2xl" w="100%" maxW="md" mx="auto" p={2} bg="white">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Heading fontSize={{ base: 'xl', md: '2xl' }} textAlign="center">
                  Quiz Submitted Successfully!
                </Heading>
                <Text textAlign="center" color="gray.600">
                  Thank you for completing the quiz, {studentName}!
                </Text>
                <VStack spacing={4}>
                  <Button colorScheme="blue" size="lg" onClick={handleShowRevision} w="full">
                    Review Your Answers
                  </Button>
                  <Button colorScheme="green" size="lg" onClick={handleShowLeaderboard} w="full">
                    View Leaderboard
                  </Button>
                  <Button variant="ghost" onClick={() => setShowQuizList(true)} w="full">
                    Back to Quiz List
                  </Button>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }

  // Landing card for name/admission
  if (!started) {
    return (
      <Container maxW={{ base: '100%', md: 'container.sm' }} py={10} px={2}>
        <VStack spacing={8} align="stretch">
          <Card boxShadow="2xl" borderRadius="2xl" w="100%" maxW="md" mx="auto" p={2} bg="white">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Heading fontSize={{ base: 'xl', md: '2xl' }} textAlign="center">
                  {selectedQuiz?.title}
                </Heading>
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
                <VStack spacing={2}>
                  <Button colorScheme="blue" size="lg" onClick={handleStart}>
                    Start Quiz
                  </Button>
                  {hasSavedProgress && (
                    <Button colorScheme="green" variant="outline" size="md" onClick={handleResume}>
                      Resume Previous Attempt
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setShowQuizList(true)}>
                    Back to Quiz List
                  </Button>
                </VStack>
                {hasSubmitted && (
                  <Text color="red.500" fontWeight="bold" textAlign="center">
                    You have already submitted this quiz.
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    );
  }

  // One-question-at-a-time UI
  const currentQuestion = questions[current];
  const totalQuestions = questions.length;
  const isLast = current === totalQuestions - 1;
  const isFirst = current === 0;

  // Prevent going back to previous questions
  const canGoPrev = false; // always false now

  return (
    <Container maxW={{ base: '100%', md: 'container.md' }} py={6} px={2}>
      <VStack spacing={6} align="stretch">
        <Heading fontSize={{ base: '2xl', md: '3xl' }}>{selectedQuiz?.title || 'Loading Quiz...'}</Heading>
        <Progress value={((current + 1) / totalQuestions) * 100} size="sm" colorScheme="blue" borderRadius="md" />
        <Text fontSize="sm" color="gray.500" alignSelf="center">
          Question {current + 1} of {totalQuestions}
        </Text>
        <FormControl isRequired isInvalid={studentName === ''} maxW="sm" alignSelf="center">
          <FormLabel>Your Name</FormLabel>
          <Input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your name"
            maxW="xs"
            isDisabled={current > 0} // lock name after first question
          />
          <FormErrorMessage>Name is required</FormErrorMessage>
        </FormControl>
        <Box minH={{ base: '260px', md: '300px' }} display="flex" alignItems="center" justifyContent="center">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%' }}
              >
                <Card
                  boxShadow="2xl"
                  borderRadius="2xl"
                  w="100%"
                  maxW="lg"
                  mx="auto"
                  p={2}
                  bg="white"
                >
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }}>{currentQuestion.question_text}</Text>
                      <RadioGroup
                        value={answers[currentQuestion.id]?.toString()}
                        onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                        isDisabled={locked[currentQuestion.id]}
                      >
                        <Stack direction="column">
                          {currentQuestion.choices.map((choice, index) => (
                            <Radio key={index} value={index.toString()} fontSize={{ base: 'sm', md: 'md' }}>
                              {choice}
                            </Radio>
                          ))}
                        </Stack>
                      </RadioGroup>
                      {answers[currentQuestion.id] !== undefined && (
                        <>
                          {answers[currentQuestion.id] === currentQuestion.correct_choice ? (
                            <Text color="green.500" fontWeight="bold">Correct!</Text>
                          ) : (
                            <>
                              <Text color="red.500" fontWeight="bold">Wrong!</Text>
                              <Text color="green.600" fontWeight="bold">
                                Correct answer: {currentQuestion.choices[currentQuestion.correct_choice]}
                              </Text>
                            </>
                          )}
                        </>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
        <HStack justify="flex-end" maxW="lg" mx="auto" w="100%">
          {/* No Previous button, only Next/Submit */}
          {!isLast ? (
            <Button
              onClick={() => setCurrent((c) => Math.min(totalQuestions - 1, c + 1))}
              isDisabled={answers[currentQuestion?.id] === undefined}
              colorScheme="blue"
              size="md"
            >
              Next
            </Button>
          ) : (
            <Button
              colorScheme="green"
              size="md"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!isFormValid()}
            >
              Submit Quiz
            </Button>
          )}
        </HStack>
        <HStack justify="space-between" w="100%" mt={4}>
          <Text fontSize="sm" color="gray.500">
            {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : ''}
          </Text>
          <HStack spacing={2}>
            {isSaving && (
              <Text fontSize="sm" color="blue.500">
                Saving...
              </Text>
            )}
          </HStack>
        </HStack>
      </VStack>
    </Container>
  );
} 