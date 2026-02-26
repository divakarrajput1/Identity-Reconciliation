import { PrismaClient, Contact } from '@prisma/client';

const prisma = new PrismaClient();
interface IdentifyInput  {
  email?: string;
  phoneNumber?: string;
}

interface IdentifyResponse  {
    contact: {
        primaryContactId: number;
        email: string[];
        phoneNumber: string[];   
        secondaryContactIds: number[];
    };
}

export const IdentifyService = async (
    input: IdentifyInput
): Promise<IdentifyResponse > => {

    const { email, phoneNumber } = input;

    if(!email && !phoneNumber) {
        throw new Error('Either email or phoneNumber must be provided');
    }

    return await prisma. $transaction(async (tx) => {
        const matchedContacts = await tx.contact.findMany({
        where: {
            OR: [
            email ? { email } : undefined,
            phoneNumber ? { phoneNumber } : undefined,
            ].filter(Boolean) as any,
        },
        });

        if (matchedContacts.length === 0) {
        const newContact = await tx.contact.create({
            data: {
            email: email ?? null,
            phoneNumber: phoneNumber ?? null,
            linkPrecedence: "primary",
            },
        });

        return buildResponse([newContact]);
        }
    // 3️⃣ Collect all possible primary IDs
    const primaryIds = new Set<number>();

    for (const contact of matchedContacts) {
      if (contact.linkPrecedence === "primary") {
        primaryIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId);
      }
    }

    // 4️⃣ Fetch all those primaries ordered by oldest
    const primaries = await tx.contact.findMany({
    where: {
        id: { in: Array.from(primaryIds) },
    },
    orderBy: {
        createdAt: "asc",
    },
    });

    const [oldestPrimary, ...otherPrimaries] = primaries;

    if (!oldestPrimary) {
    throw new Error("Invariant violation: No primary contact found");
    }

    // 5️⃣ Merge other primaries into oldest
    for (const primary of primaries.slice(1)) {
      if (primary.linkPrecedence === "primary") {
        await tx.contact.update({
          where: { id: primary.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: oldestPrimary.id,
          },
        });
      }
    }

    // 6️⃣ Check if incoming data introduces new information
    const emailExists = email
      ? matchedContacts.some((c) => c.email === email)
      : true;

    const phoneExists = phoneNumber
      ? matchedContacts.some((c) => c.phoneNumber === phoneNumber)
      : true;

    if (!emailExists || !phoneExists) {
      await tx.contact.create({
        data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
          linkPrecedence: "secondary",
          linkedId: oldestPrimary.id,
        },
      });
    }

    // 7️⃣ Fetch complete cluster (primary + all secondaries)
    const fullCluster = await tx.contact.findMany({
      where: {
        OR: [
          { id: oldestPrimary.id },
          { linkedId: oldestPrimary.id },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return buildResponse(fullCluster);
  });
};

// -----------------------------
// Response Builder
// -----------------------------
const buildResponse = (contacts: Contact[]): IdentifyResponse => {
  const primary = contacts.find(
    (c) => c.linkPrecedence === "primary"
  );

  if (!primary) {
    throw new Error("Primary contact not found");
  }

  return {
    contact: {
      primaryContactId: primary.id,
      email: Array.from(
        new Set(
          contacts
            .map((c) => c.email)
            .filter((email): email is string => Boolean(email))
        )
      ),
      phoneNumber: Array.from(
        new Set(
          contacts
            .map((c) => c.phoneNumber)
            .filter((phone): phone is string => Boolean(phone))
        )
      ),
      secondaryContactIds: contacts
        .filter((c) => c.linkPrecedence === "secondary")
        .map((c) => c.id),
    },
  };
};