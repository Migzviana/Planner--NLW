import { Alert, Keyboard, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { TripDetails, tripServer } from "@/server/trip-server";
import { Loading } from "@/components/loading";
import { Input } from "@/components/input";
import {
  CalendarRange,
  Info,
  MapPin,
  Settings2,
  Calendar as IconCalendar,
  User,
  Mail,
} from "lucide-react-native";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { Button } from "@/components/button";
import { Activities } from "./activities";
import { Details } from "./details";
import { Modal } from "@/components/modal";
import { Calendar, DateData } from "react-native-calendars";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { validateInput } from "@/utils/validateInput";
import { participantsServer } from "@/server/participants-server";
import { tripStorage } from "@/storage/trip";

type TripData = TripDetails & { when: string };

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2,
  CONFIRM_ATTENDANCE = 3,
}

export default function Trip() {
  //Loading
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [isConfirmingAttendance, setIsConfirmingAttendance] = useState(false);

  //Modal
  const [showModal, setShowModal] = useState(MODAL.NONE);

  //Data
  const [tripDetails, setTripDetails] = useState({} as TripData);
  const [option, setOption] = useState<"activity" | "details">("activity");
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
  const [destination, setDestination] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const tripParams = useLocalSearchParams<{
    id: string;
    participant?: string;
  }>();

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true);

      if(tripParams.participant){
        setShowModal(MODAL.CONFIRM_ATTENDANCE)
      }

      if (!tripParams.id) {
        return router.back();
      }

      const trip = await tripServer.getById(tripParams.id);

      const maxLengthDestination = 14;
      const destination =
        trip.destination.length > maxLengthDestination
          ? trip.destination.slice(0, maxLengthDestination) + "..."
          : trip.destination;

      const starts_at = dayjs(trip.starts_at).format("DD");
      const ends_at = dayjs(trip.ends_at).format("DD");
      const month = dayjs(trip.starts_at).format("MMM");

      setTripDetails({
        ...trip,
        when: `${destination} de ${starts_at} a ${ends_at} de ${month}.`,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingTrip(false);
    }
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });

    setSelectedDates(dates);
  }

  async function handleUpdateTrip() {
    try {
      if (!tripParams.id) {
        return;
      }

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
        return Alert.alert(
          "Atualizar viagem",
          "Lembre-se de, além de preencher o destino, selecione data de íncio e fim da viagem."
        );
      }

      setIsUpdatingTrip(true);

      await tripServer.update({
        id: tripParams.id,
        destination,
        starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt.dateString).toString(),
      });

      Alert.alert("Atualizar viagem", "Viagem atualizada com sucesso!", [
        {
          text: "Ok",
          onPress: () => {
            setShowModal(MODAL.NONE);
            getTripDetails();
          },
        },
      ]);
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdatingTrip(false);
    }
  }

  async function handleConfirmAttendance() {
    try {
      if (!tripParams.id || !tripParams.participant) {
        return;
      }

      if (!guestEmail.trim() || !guestEmail.trim()) {
        return Alert.alert(
          "Confirmação",
          "Preencha nome e email para confirmar a viagem"
        );
      }

      if (!validateInput.email(guestEmail.trim())) {
        return Alert.alert("Confirmação", "E-mail invalido");
      }

      setIsConfirmingAttendance(true);

      await participantsServer.confirmTripByParticipantId({
        participantId: tripParams.participant,
        name: guestName,
        email: guestEmail.trim(),
      });

      Alert.alert("Confirmação", "Viagem confirmada com sucesso!");

      await tripStorage.save(tripParams.id);

      setShowModal(MODAL.NONE);
    } catch (error) {
      console.log(error);
      Alert.alert("Confirmação", "Não foi possivel confirmar!");
    } finally {
      setIsConfirmingAttendance(false);
    }
  }
  useEffect(() => {
    getTripDetails();
  }, []);

  if (isLoadingTrip) {
    return <Loading />;
  }

  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} readOnly />

        <TouchableOpacity
          activeOpacity={0.6}
          className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
          onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
        >
          <Settings2 color={colors.zinc[400]} size={20} />
        </TouchableOpacity>
      </Input>

      {option === "activity" ? (
        <Activities tripDetails={tripDetails} />
      ) : (
        <Details tripId={tripDetails.id} />
      )}

      <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
        <View className=" w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button
            className="flex-1"
            onPress={() => setOption("activity")}
            variant={option === "activity" ? "primary" : "secondary"}
          >
            <Button.Title>
              Atividades
              <CalendarRange
                color={
                  option === "activity" ? colors.lime[950] : colors.zinc[200]
                }
                size={25}
              />
            </Button.Title>
          </Button>

          <Button
            className="flex-1"
            onPress={() => setOption("details")}
            variant={option === "details" ? "primary" : "secondary"}
          >
            <Button.Title>
              Detalhes
              <Info
                color={
                  option === "details" ? colors.lime[950] : colors.zinc[200]
                }
                size={25}
              />
            </Button.Title>
          </Button>
        </View>
        <Modal
          title="Atualizar Viagem"
          subtitle="Somente quem criou a viagem pode editar."
          visible={showModal === MODAL.UPDATE_TRIP}
          onClose={() => setShowModal(MODAL.NONE)}
        >
          <View className="gap-2 my-4">
            <Input variant="secondary">
              <MapPin color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Para onde ?"
                onChangeText={setDestination}
                value={destination}
              />
            </Input>

            <Input variant="secondary">
              <IconCalendar color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Quando ?"
                value={selectedDates.formatDatesInText}
                onPressIn={() => setShowModal(MODAL.CALENDAR)}
                onFocus={() => Keyboard.dismiss()}
              />
            </Input>

            <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
              <Button.Title>Atualizar</Button.Title>
            </Button>
          </View>
        </Modal>

        <Modal
          title="Selecionar datas"
          subtitle="Selecione a data de ida e volta da viagem"
          visible={showModal === MODAL.CALENDAR}
          onClose={() => setShowModal(MODAL.NONE)}
        >
          <View className="gap-4 mt-4">
            <Calendar
              minDate={dayjs().toISOString()}
              onDayPress={handleSelectDate}
              markedDates={selectedDates.dates}
            />

            <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
              <Button.Title>Confirmar</Button.Title>
            </Button>
          </View>
        </Modal>

        <Modal title="Confirmar presença" visible={showModal === MODAL.CONFIRM_ATTENDANCE}>
          <View className="gap-4 mt-4">
            <Text className="text-zinc-400 font-regular leading-6 my-2">
              Você foi convidado (a) para participar para uma viagem para
              <Text className="font-semibold text-zinc-100">
                {" "}
                {tripDetails.destination}
                {""}
              </Text>
              nas datas de
              <Text className="font-semibold text-zinc-100">
                {" "}
                {dayjs(tripDetails.starts_at).date()} a {""}
                {dayjs(tripDetails.ends_at).date()} de {""}
                {dayjs(tripDetails.ends_at).format("MMMM")}. {"\n\n"}
              </Text>
              Para confirmar sua presença na viagem, preencha os dados abaixo:
            </Text>

            <Input variant="secondary">
              <User color={colors.zinc[400]} size={20} />
              <Input.Field placeholder="Seu nome completo" onChangeText={setGuestName} />
            </Input>

            <Input variant="secondary">
              <Mail color={colors.zinc[400]} size={20} />
              <Input.Field placeholder="E-mail de confirmação" onChangeText={setGuestEmail} />
            </Input>

            <Button isLoading={isConfirmingAttendance} onPress={handleConfirmAttendance}>
              <Button.Title>Confirmar minha presença</Button.Title>
            </Button>
          </View>
        </Modal>
      </View>
    </View>
  );
}

export { TripData };
