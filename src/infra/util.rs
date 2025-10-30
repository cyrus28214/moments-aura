// pub fn rewrite_file_name(file_name: &str) -> String {
//     let file_name_filtered =
//         file_name.replace(|c: char| c != '.' && !c.is_ascii_alphanumeric(), "_");

//     format!("{}_{}", uuid::Uuid::now_v7(), file_name_filtered)
// }

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn test_rewrite_file_name() {
//         let file_name = "my test file.jpg";
//         let rewritten_file_name = rewrite_file_name(file_name);
//         let expected_suffix = "_my_test_file.jpg";
//         assert!(rewritten_file_name.len() == 36 + expected_suffix.len());
//         assert!(rewritten_file_name.ends_with(expected_suffix));
//     }
// }
