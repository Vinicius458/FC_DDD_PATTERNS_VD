import EventHandlerInterface from "../../../../@shared/event/event-handler.interface";
import CustomerCreatedEvent from "../../customer-created/customer-created.event";
import ChangedAddressEvent from "../changed_address.event";

export default class EnviaConsoleLogHandler
  implements EventHandlerInterface<ChangedAddressEvent>
{
  handle(event: CustomerCreatedEvent): void {
    const { id, name, address } = event.eventData;
    console.log(
      `Endereço do cliente: ${id}, ${name} alterado para: ${address}`
    );
  }
}
