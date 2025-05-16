import {
  Badge,
  Button,
  Flex,
  HStack,
  IconButton,
  Status,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  BlockIcon,
  ConversationIcon,
  EditIcon,
  EditImages,
  LikeIcon,
  ReportIcon,
} from "@/components/Icons.tsx";
import {UserImage} from "@/components/UserImage.tsx";
import {UserProfile} from "@/lib/interface.ts";
import {useNavigate} from "@tanstack/react-router";
import {useEffect, useState} from "react";
import {BlockUser, LikeUser, ReportUser} from "@/lib/query.ts";
import {ToasterSuccess} from "@/lib/toaster.ts";

export function Profile({data, isMe}: { data: UserProfile; isMe: boolean }) {
  const navigate = useNavigate();
  const age = new Date().getFullYear() - new Date(data.birthDate).getFullYear();
  const sexualOrientation =
    data.sexualOrientation === 1
      ? "Heterosexual"
      : data.sexualOrientation === 2
        ? "Homosexual"
        : "Bisexual";

  return (
    <Flex
      direction="column"
      gap={4}
      justifyContent="center"
      alignItems="center"
      position={"relative"}
    >
      {isMe && (
        <Button
          onClick={async () => {
            await navigate({
              to: "/me/edit-info",
              search: {
                fromProfile: true,
              },
            });
          }}
          position={"absolute"}
          top={5}
          right={5}
        >
          <EditIcon/>
        </Button>
      )}
      <Flex
        w="100%"
        maxW={1000}
        px={4}
        gap={4}
        alignItems="center"
        justifyContent="left"
        wrap="wrap"
      >
        <VStack gap={2} alignItems="center">
          <UserImage
            imageName={data.images[1]}
            width="300px"
            height="300px"
            borderRadius={"full"}
          />
          {!isMe && <UserAction data={data}/>}
        </VStack>
        <Flex direction={"column"} alignItems="left" gap={4} grow={1}>
          <Flex direction="column" gap={2} p={2}>
          	<Flex direction={"row"} gap={4}>
				<Text>{data.firstName + " " + data.lastName}</Text>
				<Badge size="md" variant="surface" maxW={"fit-content"}>
				  {data.username}
				</Badge>
			</Flex>
            <Text>{data.address}</Text>
            <Flex gap={6} alignItems="center">
              <Text>{age} ans</Text>
              <Text>{data.gender === 1 ? "Male" : "Female"}</Text>
              <Text>{sexualOrientation}</Text>
            </Flex>
            <Badge size="md" variant="surface" maxW={"fit-content"}>
              Fame {data.fameRating}
            </Badge>
            {!isMe && (
              <Flex gap={2} alignItems="center">
                <Status.Root colorPalette={data.isOnline ? "green" : "red"}>
                  <Status.Indicator/>
                </Status.Root>
                <Text>{data.isOnline ? "Online" : "Offline"}</Text>
                <Text fontSize={"sm"} color="gray.500">
                  {!data.isOnline && data.lastSeen
                    ? `Last seen ${new Date(data.lastSeen).toLocaleString()}`
                    : ""}
                </Text>
              </Flex>
            )}
            <Flex gap={2} wrap="wrap">
              {data.tags &&
                Object.entries(data.tags).map(([key, value]) => {
                  return (
                    <Badge key={value} size="lg" variant="solid">
                      {key}
                    </Badge>
                  );
                })}
            </Flex>
          </Flex>
          <Flex
            direction={"column"}
            gap={1}
            w="100%"
            h={150}
            p={4}
            borderWidth="1px"
            borderRadius={8}
            borderColor="gray.200"
          >
            <Text color={"gray.500"} fontSize={"sm"}>
              Biography
            </Text>
            <Text>{data.biography}</Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        wrap="wrap"
        gap={4}
        justifyContent="center"
        alignItems="center"
        w={"100%"}
        p={4}
        position={"relative"}
      >
        {isMe && (
          <Button
            onClick={async () => {
              await navigate({
                to: "/me/edit-images",
                search: {
                  fromProfile: true,
                },
              });
            }}
            position={"absolute"}
            top={5}
            right={5}
          >
            <EditImages/>
          </Button>
        )}
        <UserImage imageName={data.images[2]}/>
        <UserImage imageName={data.images[3]}/>
        <UserImage imageName={data.images[4]}/>
        <UserImage imageName={data.images[5]}/>
      </Flex>
    </Flex>
  );
}

function UserAction({data}: { data: UserProfile }) {
  const navigate = useNavigate();
  const [isLike, setIsLike] = useState(data.isLiked);
  const [isBlock, setIsBlock] = useState(data.isBlocked);
  const [isMatch, setIsMatch] = useState(data.isMatched);

  useEffect(() => {
    if (!isLike && isMatch) {
      setIsMatch(false);
    }

    if (isLike && isBlock) {
      LikeUser(data.username, false).then(() => {
        setIsLike(false);
        setIsMatch(false);
      });
    }
  }, [isLike, isBlock, isMatch]);

  return (
    <HStack gap={6} alignItems="center">
      {!isBlock && (
        <IconButton
          variant="ghost"
          onClick={async () => {
            const result = await LikeUser(data.username, !isLike);
            if (!result) return;
            if (!isMatch && result.matchStatus) {
              ToasterSuccess("It's a match!");
              setIsMatch(true);
            }
            setIsLike(!isLike);
          }}
        >
          <LikeIcon checked={isLike}/>
        </IconButton>
      )}
      {isMatch && (
        <IconButton
          variant="ghost"
          onClick={async () => {
            await navigate({
              to: "/match",
              search: {
                username: data.username,
              },
            });
          }}
        >
          <ConversationIcon/>
        </IconButton>
      )}
      <IconButton
        variant="ghost"
        onClick={async () => {
          if (await BlockUser(data.username, !isBlock)) {
            ToasterSuccess(!isBlock ? "User blocked" : "User unblocked");
            setIsBlock(!isBlock);
          }
        }}
      >
        <BlockIcon checked={isBlock}/>
      </IconButton>
      <IconButton
        variant="ghost"
        onClick={async () => {
          await ReportUser(data.username);
        }}
      >
        <ReportIcon/>
      </IconButton>
    </HStack>
  );
}
