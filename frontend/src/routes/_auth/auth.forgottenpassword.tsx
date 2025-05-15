import {FormEvent, useState} from 'react'
import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {
  Card,
  Button,
  Input,
  Stack,
  Text,
  Flex,
} from '@chakra-ui/react'
import {Link} from '@tanstack/react-router'
import {RiArrowRightLine} from 'react-icons/ri'
import {ToasterError, ToasterSuccess} from "@/lib/toaster.ts";

export const Route = createFileRoute('/_auth/auth/forgottenpassword')({
  component: ForgottenPasswordForm,
})

function ForgottenPasswordForm() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await fetch(
        'http://localhost:5163/Auth/ForgottenPassword/',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({Email: email, UserName: email}),
        },
      )
      ToasterSuccess('Email sent with success')
      await navigate({to: '/auth/login'})
    } catch (err) {
      ToasterError('Error', 'An error occurred while sending the reset link.')
      await navigate({to: '/auth/login'})
    }
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
    </Flex>
  )
}
