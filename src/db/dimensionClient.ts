import mongoose from "mongoose";

export const DIMENTION_MODEL = "Dimension";

export interface IDimension {
  name: string;
  servers: [
    {
      server_id: string;
      channel_id: string;
    }
  ];
}

const dimensionSchema = new mongoose.Schema<IDimension>({
  name: { type: String, required: true },
  servers: [
    {
      server_id: { type: String, required: true, unique: false },
      channel_id: { type: String, required: true, unique: false },
    },
  ],
});

const Dimension = mongoose.model<IDimension>(DIMENTION_MODEL, dimensionSchema);

export const channelDimension = async (channelId: string): Promise<string> => {
  const dimension = await Dimension.findOne({
    "servers.channel_id": channelId,
  });

  if (!dimension) {
    return ``;
  }

  return dimension.name;
};

export const dimensionChannels = async (
  dimensionName: string
): Promise<Array<string>> => {
  //get all server channels with dimension name
  try {
    const dimension = await Dimension.findOne({ name: dimensionName });
    if (!dimension) {
      return [];
    }
    const channels = dimension.servers.map((server) => server.channel_id);

    return channels;
  } catch (err) {
    console.log("Error fetching channels : " + err);
    return [];
  }
};

export const addServerToDimension = async (
  dimensionName: string,
  serverId: string,
  channelId: string
): Promise<boolean> => {
  try {
    let dimension = await Dimension.findOne({ name: dimensionName });

    if (!dimension) {
      console.log("No dimension found, creating one...");

      dimension = new Dimension({
        name: dimensionName,
        servers: [
          {
            server_id: serverId,
            channel_id: channelId,
          },
        ],
      });
    } else {
      dimension.servers.push({
        server_id: serverId,
        channel_id: channelId,
      });
    }
    console.log("Created!" + dimension);
    await dimension.save();
    console.log("Dimension added.");
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
