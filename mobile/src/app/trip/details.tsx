import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { linksServer } from "@/server/links-server";
import { colors } from "@/styles/colors";
import { validateInput } from "@/utils/validateInput";
import { Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Text, View, FlatList } from "react-native";
import { TripLink, TripLinkProps } from "@/components/tripLink";
import { participantsServer } from "@/server/participants-server";
import { Participant, ParticipantProps } from "@/components/participant";

export function Details({ tripId }: { tripId: string }) {
  // Modal
  const [showNewLinkModal, setShowNewLinkModal] = useState(false);

  // Lists
  const [links, setLinks] = useState<TripLinkProps[]>([]);
  const [participants, setParticipants] = useState<ParticipantProps[]>([]);

  // Loading
  const [isCreatingLinkTrip, setIsCreatingLinkTrip] = useState(false);

  // Data
  const [linkTitle, setLinkTitle] = useState("");
  const [linkURL, setLinkURL] = useState("");

  function resetNewLinkFields() {
    setLinkTitle("");
    setLinkURL("");
    setShowNewLinkModal(false);
  }

  async function getTripLinks() {
    try {
      const links = await linksServer.getLinksByTripId(tripId);
      setLinks(links);
    } catch (error) {
      console.error('Erro ao buscar links:', error);
      Alert.alert('Erro', 'Não foi possível carregar os links.');
    }
  }

  async function getTripParticipants() {
    try {
      const participants = await participantsServer.getByTripId(tripId);
      setParticipants(participants);
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os participantes.');
    }
  }

  useEffect(() => {
    getTripLinks();
    getTripParticipants();
  }, [tripId]);

  async function handleCreateTripLink() {
    try {
      if (!linkTitle.trim()) {
        return Alert.alert("Link", "Informe um título para o link!");
      }

      if (!validateInput.url(linkURL.trim())) {
        return Alert.alert("Link", "Link inválido!");
      }

      setIsCreatingLinkTrip(true);

      await linksServer.create({
        tripId,
        title: linkTitle,
        url: linkURL,
      });

      Alert.alert("Link", "Link cadastrado com sucesso!");
      resetNewLinkFields();
      getTripLinks(); // Atualiza a lista de links após adicionar um novo link
    } catch (error) {
      console.error('Erro ao criar link:', error);
    } finally {
      setIsCreatingLinkTrip(false);
    }
  }

  return (
    <View className="flex-1 mt-10">
      <Text className="text-zinc-50 text-2xl font-semibold mb-2">
        Links importantes
      </Text>

      <View className="flex-1">
        {links.length > 0 ? (
          <FlatList
            data={links}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TripLink data={item} />}
            contentContainerClassName="gap-4"
          />
        ) : (
          <Text className="text-zinc-400 font-regular text-base mt-2 mb-6">
            Nenhum link adicionado
          </Text>
        )}

        <Button variant="secondary" onPress={() => setShowNewLinkModal(true)}>
          <Button.Title>
            Cadastrar Novo link
            <Plus color={colors.zinc[200]} size={20} />
          </Button.Title>
        </Button>
      </View>

      <View className="flex-1 border-t border-zinc-800 mt-6">
        <Text className="text-zinc-50 text-2xl font-semibold mb-2">
          Convidados
        </Text>

        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Participant data={item} />}
          contentContainerClassName="gap-4 pb-44"
        />
      </View>

      <Modal
        title="Cadastrar link"
        subtitle="Todos os convidados podem visualizar os links importantes."
        visible={showNewLinkModal}
        onClose={() => setShowNewLinkModal(false)}
      >
        <View className="gap-2 mb-3">
          <Input variant="secondary">
            <Input.Field
              placeholder="Título do link"
              onChangeText={setLinkTitle}
            />
          </Input>

          <Input variant="secondary">
            <Input.Field placeholder="URL" onChangeText={setLinkURL} />
          </Input>
        </View>

        <Button isLoading={isCreatingLinkTrip} onPress={handleCreateTripLink} disabled={isCreatingLinkTrip}>
          <Button.Title>Salvar Link</Button.Title>
        </Button>
      </Modal>
    </View>
  );
}
