const allocationSeed = [
  // Eight brands with one dedicated employee each
  ...Array.from({ length: 8 }, (_, index) => ({
    brandName: [
      "NovaCare",
      "UrbanStyle",
      "TechNova",
      "FreshMart",
      "HomeEase",
      "FinEdge",
      "TravelNest",
      "EduSphere",
    ][index],
    employeeCode: `EMP${String(index + 1).padStart(3, "0")}`,
    processNames: [
      "Voice Support",
      "Email Support",
      "Chat Support",
      "Technical Support",
      "Back Office",
    ],
  })),

  // QuickCart: three employees with overlapping processes
  {
    brandName: "QuickCart",
    employeeCode: "EMP009",
    processNames: ["Voice Support", "Email Support"],
  },
  {
    brandName: "QuickCart",
    employeeCode: "EMP010",
    processNames: ["Email Support", "Chat Support"],
  },
  {
    brandName: "QuickCart",
    employeeCode: "EMP011",
    processNames: ["Technical Support", "Back Office"],
  },

  // CloudConnect: three employees with overlapping processes
  {
    brandName: "CloudConnect",
    employeeCode: "EMP010",
    processNames: ["Voice Support", "Chat Support"],
  },
  {
    brandName: "CloudConnect",
    employeeCode: "EMP012",
    processNames: ["Email Support", "Technical Support"],
  },
  {
    brandName: "CloudConnect",
    employeeCode: "EMP013",
    processNames: ["Chat Support", "Back Office"],
  },
];

module.exports = allocationSeed;
