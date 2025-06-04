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

  // Auto-save and resume logic
  const QUIZ_KEY = selectedQuiz && admissionNumber ? `quiz-progress-${selectedQuiz.id}-${admissionNumber}` : '';

  // Auto-save on every change
  useEffect(() => {
    if (QUIZ_KEY && !isSubmitted && !hasSubmitted) {
      setIsSaving(true);
      const saveData = {
        studentName,
        admissionNumber,
        answers,
        locked,
        current,
        started,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(QUIZ_KEY, JSON.stringify(saveData));
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentName, admissionNumber, answers, locked, current, started, QUIZ_KEY]);

  // Restore progress on load
  useEffect(() => {
    if (QUIZ_KEY && !isSubmitted && !hasSubmitted) {
      const saved = localStorage.getItem(QUIZ_KEY);
      setHasSavedProgress(!!saved);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            // Only restore the current position if we're resuming
            if (parsed.resumeNow) {
              setStudentName(parsed.studentName || '');
              setAnswers(parsed.answers || {});
              setLocked(parsed.locked || {});
              setCurrent(parsed.current || 0);
              setStarted(true);
              if (parsed.lastSaved) {
                setLastSaved(new Date(parsed.lastSaved));
              }
              
              // Show a toast to confirm resume
              toast({
                title: 'Quiz Resumed',
                description: `Continuing from question ${parsed.current + 1}`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
              
              // Remove the resumeNow flag
              localStorage.setItem(QUIZ_KEY, JSON.stringify({ ...parsed, resumeNow: false }));
            }
          }
        } catch (error) {
          console.error('Error restoring quiz:', error);
          toast({
            title: 'Error Restoring Quiz',
            description: 'Could not restore your progress. Starting from the beginning.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QUIZ_KEY]);

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
    
    // Check for saved progress
    const saved = localStorage.getItem(`quiz-progress-${quiz.id}-${admissionNumber}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setHasSavedProgress(true);
          // Don't auto-resume, just show the option to resume
          setStudentName(parsed.studentName || '');
        }
      } catch (error) {
        console.error('Error checking saved progress:', error);
      }
    }
    
    // Reset other states
    setHasSubmitted(false);
    setIsSubmitted(false);
    setStarted(false);
    setShowRevision(false);
    setShowLeaderboard(false);
    setAnswers({});
    setLocked({});
    setCurrent(0);
    setLastSaved(null);
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

  const handleResume = () => {
    if (QUIZ_KEY) {
      const saved = localStorage.getItem(QUIZ_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            // First set started to true to ensure we're in quiz mode
            setStarted(true);
            
            // Then restore all other state
            setStudentName(parsed.studentName || '');
            setAnswers(parsed.answers || {});
            setLocked(parsed.locked || {});
            
            // Force the current question to be set after a small delay
            // to ensure the quiz is properly initialized
            setTimeout(() => {
              setCurrent(parsed.current || 0);
              if (parsed.lastSaved) {
                setLastSaved(new Date(parsed.lastSaved));
              }
              
              // Show a toast to confirm resume
              toast({
                title: 'Quiz Resumed',
                description: `Continuing from question ${parsed.current + 1}`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            }, 100);
          }
        } catch (error) {
          console.error('Error resuming quiz:', error);
          toast({
            title: 'Error Resuming Quiz',
            description: 'Could not restore your progress. Starting from the beginning.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
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
          <Heading textAlign="center">Available Quizzes</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  cursor="pointer"
                  onClick={() => handleQuizSelect(quiz)}
                  _hover={{ transform: 'scale(1.02)', shadow: 'lg' }}
                  transition="all 0.2s"
                >
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Heading size="md">{quiz.title}</Heading>
                      <Text color="gray.500">
                        Created: {new Date(quiz.created_at).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </SimpleGrid>
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
          {isSaving && (
            <Text fontSize="sm" color="blue.500">
              Saving...
            </Text>
          )}
        </HStack>
      </VStack>
    </Container>
  );
} 