/**
 * Utility script to delete communities by name
 * 
 * Usage in your app:
 * 1. Import: import CommunityAdminService from "../services/CommunityAdminService";
 * 2. Call: await CommunityAdminService.deleteCommunitiesByName("poems");
 * 
 * Or use in React Native Debugger console:
 * const CommunityAdminService = require("./services/CommunityAdminService").default;
 * CommunityAdminService.deleteCommunitiesByName("poems").then(console.log);
 */

// Example usage in a React component or screen:
/*
import React from "react";
import { View, Button, Alert } from "react-native";
import CommunityAdminService from "../services/CommunityAdminService";

const AdminPanel = () => {
  const handleDeletePoems = async () => {
    Alert.alert(
      "Delete All 'Poems' Communities?",
      "This will permanently delete all communities named 'poems'. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await CommunityAdminService.deleteCommunitiesByName("poems");
              Alert.alert(
                "Success",
                `Deleted ${result.deleted} communities. ${result.errors.length > 0 ? `Errors: ${result.errors.length}` : ""}`
              );
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View>
      <Button title="Delete All 'Poems' Communities" onPress={handleDeletePoems} />
    </View>
  );
};
*/

export default null;




