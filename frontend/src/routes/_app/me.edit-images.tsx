import {createFileRoute, useNavigate, useSearch} from '@tanstack/react-router'
import {FileUploadDropzone, FileUploadRoot} from '@/components/ui/file-upload'
import {AspectRatio, Flex, Grid, Image} from '@chakra-ui/react'
import {ToasterError, ToasterSuccess} from '@/lib/toaster.ts'
import {useContext, useEffect, useState} from 'react'
import {CloseButton} from '@/components/ui/close-button.tsx'
import {TrashIcon} from '@/components/Icons.tsx'
import {Button} from '@/components/ui/button.tsx'
import {
  DeleteImage,
  DownloadImage,
  UploadToServer,
  ValidateProfile,
} from '@/lib/query.ts'
import {UserContext, UserProfile} from '@/lib/interface.ts'
import {AxiosError} from 'axios'

export const Route = createFileRoute('/_app/me/edit-images')({
  component: RouteComponent,
})

function UploadImageComponent({
                                imageName,
                                position,
                              }: {
  imageName?: string
  position: number
}) {
  const [isHovering, setIsHovering] = useState(false)
  const [onDelete, setOnDelete] = useState(false)
  const [image, setImage] = useState<string>('')

  useEffect(() => {
    if (!imageName) return

    DownloadImage(imageName)
    .then((res) => {
      setImage(res.data);
    })
  }, [imageName])

  return (
    <FileUploadRoot
      position={'relative'}
      maxW="500px"
      alignItems="stretch"
      maxFiles={1}
      accept={['image/png', 'image/jpeg']}
      maxFileSize={5000000}
      onFileAccept={async (file) => {
        if (!file.files[0]) return

        // upload file
        const result = await UploadToServer(file.files[0], position)
        if (!result) return

        await DownloadImage(result)
        .then((res) => {
          setImage(res.data)
        })
        .catch(async (error) => {
          console.error(error)
        })
      }}
      onFileReject={(files) => {
        if (!files.files[0]) {
          return
        }

        files.files[0].errors.forEach((error) => {
          if (error === 'FILE_INVALID_TYPE') {
            ToasterError('Invalid file type')
          } else if (error === 'FILE_TOO_LARGE') {
            ToasterError('File is too large')
          } else {
            ToasterError(error)
          }
        })
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={onDelete}
    >
      <AspectRatio ratio={1}>
        <FileUploadDropzone
          padding={image ? 0 : 4}
          label="Drag and drop here to upload"
          description=".png, .jpg up to 5MB"
        >
          {image ? (
            <>
              {isHovering ? (
                <CloseButton
                  position={'absolute'}
                  variant="solid"
                  top={5}
                  right={5}
                  onMouseEnter={() => setOnDelete(true)}
                  onMouseLeave={() => setOnDelete(false)}
                  onClick={async () => {
                    await DeleteImage(position)
                    .then(() => {
                      setOnDelete(false)
                      setImage('')
                      ToasterSuccess('Image deleted successfully')
                    })
                    .catch(async (err: AxiosError) => {
                      console.error(err)
                      ToasterError('An error occured')
                    })
                  }}
                >
                  <TrashIcon/>
                </CloseButton>
              ) : null}
              <Image
                src={image}
                alt="Image"
                w={'100%'}
                h={'100%'}
                fit={'cover'}
              />
            </>
          ) : null}
        </FileUploadDropzone>
      </AspectRatio>
    </FileUploadRoot>
  )
}

function RouteComponent() {
  const navigate = useNavigate({from: Route.fullPath})
  const fromProfile = useSearch(Route.id) as {
    fromProfile: boolean
  } ?? false;
  const profile = useContext(UserContext)?.profileData as UserProfile

  return (
    <Grid gap="4" p="4">
      <Flex gap="4" wrap="wrap" justifyContent="center" alignItems="center">
        <UploadImageComponent imageName={profile.images[0]} position={1}/>
        <UploadImageComponent imageName={profile.images[1]} position={2}/>
        <UploadImageComponent imageName={profile.images[2]} position={3}/>
        <UploadImageComponent imageName={profile.images[3]} position={4}/>
        <UploadImageComponent imageName={profile.images[4]} position={5}/>
      </Flex>
      <Button
        justifySelf={'center'}
        maxW={75}
        onClick={async () => {
          const result = await ValidateProfile()
          if (result) {
            if (fromProfile) {
              await navigate({
                to: '/me/profile',
              })
              return
            } else {
              await navigate({
                to: '/home',
              })
            }
          }
        }}
      >
        Save
      </Button>
    </Grid>
  )
}
