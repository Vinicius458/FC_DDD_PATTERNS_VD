import EventInterface from "../../../@shared/event/event.interface";
import { ChangedAddressDataInterface } from "./changed-address-data.interface";

export default class ChangedAddressEvent implements EventInterface {
  dataTimeOccurred: Date;
  eventData: ChangedAddressDataInterface;

  constructor(eventData: ChangedAddressDataInterface) {
    this.dataTimeOccurred = new Date();
    this.eventData = eventData;
  }
}
