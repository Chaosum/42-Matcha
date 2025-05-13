import {FormEvent, useState} from 'react'
import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {
  Card,
  Button,
  Input,
  Stack,
  Text,
  Flex,
  useDisclosure,
} from '@chakra-ui/react'
import {Link} from '@tanstack/react-router'
import {RiArrowRightLine} from 'react-icons/ri'

export const Route = createFileRoute('/_auth/auth/forgottenpassword')({
  component: ForgottenPasswordForm,
})

export default function ForgottenPasswordForm() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const {open, onOpen, onClose} = useDisclosure()
  const [redirectTimeout, setRedirectTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(
        'http://localhost:5163/Auth/ForgottenPassword/',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({Email: email, UserName: email}),
        },
      )

      onOpen() // Affiche la modal

      // Démarre un timer pour redirection après 5 secondes
      const timeout = setTimeout(() => {
        navigate({to: '/auth/login'})
      }, 5000)
      setRedirectTimeout(timeout)
    } catch (err) {
      onOpen() // Même comportement en cas d'erreur
      const timeout = setTimeout(() => {
        navigate({to: '/auth/login'})
      }, 5000)
      setRedirectTimeout(timeout)
    }
  }

  const handleClose = async () => {
    if (redirectTimeout) {
      clearTimeout(redirectTimeout) // Stoppe le timeout si l'utilisateur clique
    }
    onClose()
    await navigate({to: '/auth/login'}) // Redirige immédiatement
  }

  return (
    <Flex justify="center" align="center" h="100%">
      <Card.Root maxW="lg" minW={{base: 'sm'}}>
        <Card.Header>
          <Text fontSize="xl" fontWeight="bold">
            Forgotten Password
          </Text>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack>
              <div>
                <Text fontWeight="semibold" mb={1}>
                  Email Address
                </Text>
                <Input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" colorScheme="blue">
                Send Reset Link
              </Button>
            </Stack>
          </form>
        </Card.Body>

        <Card.Footer justifyContent="center">
          <Stack direction="column" align="center">
            <Text>Remembered your password?</Text>
            <Link to={'/auth/login'} className="chakra-button">
              <Button size="xs" variant="subtle">
                Sign in <RiArrowRightLine/>
              </Button>
            </Link>
          </Stack>
        </Card.Footer>
      </Card.Root>

      {/* Modal de confirmation */}
      {/*<Modal isOpen={open} onClose={handleClose} isCentered>*/}
      {/*  <ModalOverlay />*/}
      {/*  <ModalContent>*/}
      {/*    <ModalHeader>Check your mailbox!</ModalHeader>*/}
      {/*    <ModalBody>*/}
      {/*      <Text>*/}
      {/*        If the email is correct, an email will be sent to your address.*/}
      {/*      </Text>*/}
      {/*      <Text mt={2}>*/}
      {/*        You will be redirected to the login page in 5 seconds...*/}
      {/*      </Text>*/}
      {/*    </ModalBody>*/}
      {/*    <ModalFooter>*/}
      {/*      <Button onClick={handleClose}>OK</Button>*/}
      {/*    </ModalFooter>*/}
      {/*  </ModalContent>*/}
      {/*</Modal>*/}
    </Flex>
  )
}
