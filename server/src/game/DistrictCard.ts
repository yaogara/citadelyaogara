import { DistrictId, districts, RoleType } from 'citadels-common';

export enum DistrictType {
  NOBLE = 1,
  RELIGIOUS,
  TRADE,
  MILITARY,
  UNIQUE,
}

export default class DistrictCard {
  id: DistrictId;
  type: DistrictType;
  cost: number;
  extraPoints: number;

  constructor(id: DistrictId, type: DistrictType, cost: number, extraPoints: number) {
    this.id = id;
    this.type = type;
    this.cost = cost;
    this.extraPoints = extraPoints;
  }

  static getDistrictTypeFromRole(role: RoleType) {
    switch (role) {
      case RoleType.BOSS:
        return DistrictType.NOBLE;
      case RoleType.POLITICIAN:
        return DistrictType.RELIGIOUS;
      case RoleType.TRAFFICKER:
        return DistrictType.TRADE;
      case RoleType.ENFORCER: // Warlord equivalent
        // Note: In standard Citadels Warlord gets income from Red (Military).
        // But in Plata o Plomo prompt, it didn't explicitly mention it.
        // However, usually color matching roles get income.
        // I will enabling it for consistency with "Warlord" mapping.
        return DistrictType.MILITARY;
      default:
        return undefined;
    }
  }
}

type DistrictsMap = Map<DistrictId, { card: DistrictCard, count: number }>;

// create districts Map from JSON
export const ALL_DISTRICTS = (Object.keys(districts) as DistrictId[]).reduce(
  (res: DistrictsMap, districtId) => {
    const data = {
      // default values
      count: 1,
      extraPoints: 0,
      // actual values
      ...districts[districtId as keyof typeof districts],
    };
    return res.set(districtId, {
      card: new DistrictCard(districtId, data.type, data.cost, data.extraPoints),
      count: data.count,
    });
  }, new Map(),
);
